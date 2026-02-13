import { useState, useEffect, useCallback, JSX } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, fraudApi } from '../services/api';
import { useDashboard } from '../hooks/useDashboard';
import { useSalesAnalytics } from '../hooks/useSalesAnalytics';
import { useFraudDashboard } from '../hooks/useFraudDashboard';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { DateRangeSelector } from '../components/ui/DateRangeSelector';
import {
  formatCurrency,
  formatDate,
  getToday,
  getCurrentMonth,
  percentChange,
} from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type {
  FraudAlert,
  StaffActivity,
  StockDiscrepancy,
  FraudSeverity,
  MonthlyReport,
} from '@coco/shared';

type DashboardTab = 'overview' | 'profit-loss' | 'fraud';

// ─── Helper: compute initial date range (this month) ─────────────────────────
function getInitialRange(): { start: string; end: string } {
  const today = getToday();
  const month = getCurrentMonth();
  return { start: `${month}-01`, end: today };
}

// ─── Helper: days between two YYYY-MM-DD strings ────────────────────────────
function daysBetween(start: string, end: string): number {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

// ─── Helper: derive month string from a date ────────────────────────────────
function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  // ── Shared date range state ──
  const initial = getInitialRange();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // ── Custom range object for hooks ──
  const hasValidRange = startDate && endDate && endDate >= startDate;
  const customRange = hasValidRange ? { startDate, endDate } : undefined;

  // ── Overview hooks (always "custom" period) ──
  const { data: dashboard, loading, error } = useDashboard('custom', '', customRange);
  const { data: analytics } = useSalesAnalytics('custom', '', customRange);

  // ── P&L report state ──
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const loadReport = useCallback(async () => {
    if (!startDate) return;
    setReportLoading(true);
    setReportError('');
    try {
      const data = await dashboardApi.getReport(monthFromDate(startDate));
      setReport(data);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setReportLoading(false);
    }
  }, [startDate]);

  useEffect(() => {
    if (activeTab === 'profit-loss') {
      loadReport();
    }
  }, [activeTab, loadReport]);

  // ── Fraud data ──
  const fraudDays = hasValidRange ? daysBetween(startDate, endDate) : 30;
  const {
    data: fraudData,
    loading: fraudLoading,
    error: fraudError,
  } = useFraudDashboard(activeTab === 'fraud' && isOwner ? fraudDays : 0);

  // ── Fraud alert count for badge ──
  const [alertCount, setAlertCount] = useState(0);
  useEffect(() => {
    if (isOwner) {
      fraudApi
        .getAlerts()
        .then((a) => setAlertCount(a.length))
        .catch(() => {});
    }
  }, [isOwner]);

  // ── Build chart data for overview ──
  const chartData = dashboard
    ? (dashboard.topProducts.length > 0
        ? dashboard.topProducts
        : analytics?.topProducts ?? []
      )
        .map((p) => ({
          name: 'productName' in p ? p.productName : '',
          revenue:
            ('totalCents' in p
              ? p.totalCents
              : (p as { totalRevenueCents: number }).totalRevenueCents) / 100,
          quantity:
            'quantity' in p
              ? p.quantity
              : (p as { totalQuantity: number }).totalQuantity,
        }))
        .slice(0, 5)
    : [];

  // ── Date range display label ──
  const rangeLabel =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : 'Select date range';

  // ── Tab definitions ──
  const TABS: { key: DashboardTab; label: string; icon: string; ownerOnly?: boolean }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'profit-loss', label: 'Profit & Loss', icon: '📈' },
    { key: 'fraud', label: 'Fraud & Audit', icon: '🔍', ownerOnly: true },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{rangeLabel}</p>
        </div>
        {alertCount > 0 && isOwner && (
          <Badge variant="danger">
            ⚠️ {alertCount} Fraud Alert{alertCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* ── Date Range Selector ── */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* ── Tab Bar ── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4" aria-label="Dashboard tabs">
          {TABS.map((tab) => {
            if (tab.ownerOnly && !isOwner) return null;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.key === 'fraud' && alertCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'overview' && (
        <OverviewTab
          dashboard={dashboard}
          analytics={analytics}
          chartData={chartData}
          loading={loading}
          error={error}
        />
      )}

      {activeTab === 'profit-loss' && (
        <ProfitLossTab
          report={report}
          loading={reportLoading}
          error={reportError}
        />
      )}

      {activeTab === 'fraud' && isOwner && (
        <FraudTab
          data={fraudData}
          loading={fraudLoading}
          error={fraudError}
          days={fraudDays}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Overview
// ═══════════════════════════════════════════════════════════════════════════════

interface OverviewTabProps {
  dashboard: ReturnType<typeof useDashboard>['data'];
  analytics: ReturnType<typeof useSalesAnalytics>['data'];
  chartData: Array<{ name: string; revenue: number; quantity: number }>;
  loading: boolean;
  error: string;
}

function OverviewTab({ dashboard, analytics, chartData, loading, error }: OverviewTabProps): JSX.Element {
  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!dashboard) return <div className="text-gray-500 text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(dashboard.totalRevenueCents)}
          icon="💰"
          subtitle={`${dashboard.salesCount} sales`}
          trend={analytics?.revenueChangePct}
        />
        <StatCard title="COGS" value={formatCurrency(dashboard.totalCogsCents)} icon="📦" />
        <StatCard title="Labor" value={formatCurrency(dashboard.totalLaborCents)} icon="👷" />
        <StatCard
          title="Net Profit"
          value={formatCurrency(dashboard.netProfitCents)}
          icon={dashboard.netProfitCents >= 0 ? '✅' : '❌'}
          className={dashboard.netProfitCents >= 0 ? '' : 'border-2 border-red-200'}
        />
      </div>

      {/* Analytics Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(analytics.avgOrderValueCents)}
            icon="🧮"
            subtitle="per transaction"
          />
          <StatCard
            title="Avg Units / Sale"
            value={String(analytics.avgUnitsPerSale)}
            icon="📊"
            subtitle="units per transaction"
          />
          <StatCard
            title="Total Transactions"
            value={String(analytics.totalSalesCount)}
            icon="🛒"
            subtitle={analytics.periodLabel}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Products">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `฿${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (฿)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quantity" name="Qty Sold" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data</p>
          )}
        </Card>

        <Card title="Expense Breakdown">
          <div className="space-y-4">
            <ExpenseRow label="COGS" amount={dashboard.totalCogsCents} color="bg-blue-500" total={dashboard.totalRevenueCents} />
            <ExpenseRow label="Labor" amount={dashboard.totalLaborCents} color="bg-amber-500" total={dashboard.totalRevenueCents} />
            <ExpenseRow label="Other" amount={dashboard.totalOtherExpensesCents} color="bg-gray-400" total={dashboard.totalRevenueCents} />
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Net Profit</span>
              <span className={dashboard.netProfitCents >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {formatCurrency(dashboard.netProfitCents)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Trend */}
      {analytics && analytics.trendData.length > 1 && (
        <Card title="Sales Trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.trendData.map((t) => ({
                name: t.label,
                revenue: t.revenueCents / 100,
                sales: t.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'revenue' ? `฿${value.toFixed(2)}` : value
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue (฿)" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="sales" name="# Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Profit & Loss
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfitLossTabProps {
  report: MonthlyReport | null;
  loading: boolean;
  error: string;
}

function ProfitLossTab({ report, loading, error }: ProfitLossTabProps): JSX.Element {
  if (loading) return <Spinner />;
  if (error) return <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>;
  if (!report) return <div className="text-gray-500 text-center py-8">No report data available</div>;

  return (
    <div className="space-y-6">
      {/* Key Metrics with month-over-month trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(report.revenueCents)}
          icon="💰"
          trend={report.previousMonth ? percentChange(report.revenueCents, report.previousMonth.revenueCents) : undefined}
          subtitle="vs prev month"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(report.grossProfitCents)}
          icon="📊"
          trend={report.previousMonth ? percentChange(report.grossProfitCents, report.previousMonth.grossProfitCents) : undefined}
          subtitle="vs prev month"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(report.netProfitCents)}
          icon={report.netProfitCents >= 0 ? '✅' : '❌'}
          trend={report.previousMonth ? percentChange(report.netProfitCents, report.previousMonth.netProfitCents) : undefined}
          subtitle="vs prev month"
          className={report.netProfitCents < 0 ? 'border-2 border-red-200' : ''}
        />
      </div>

      {/* P&L Breakdown */}
      <Card title="Profit & Loss Breakdown">
        <div className="space-y-3">
          <PLRow label="Total Revenue" amount={report.revenueCents} bold />
          <PLRow label="− Cost of Goods Sold (COGS)" amount={-report.cogsCents} indent />
          <div className="border-t my-2" />
          <PLRow label="Gross Profit" amount={report.grossProfitCents} bold highlight />
          <PLRow label="− Labor Costs" amount={-report.laborCents} indent />
          <PLRow label="− Utilities" amount={-report.utilityCents} indent />
          <PLRow label="− Other Expenses" amount={-report.otherExpensesCents} indent />
          <div className="border-t-2 border-gray-800 my-2" />
          <PLRow
            label="Net Profit"
            amount={report.netProfitCents}
            bold
            highlight
            className={report.netProfitCents >= 0 ? 'text-emerald-600' : 'text-red-500'}
          />
        </div>
      </Card>

      {/* Previous Month Comparison */}
      {report.previousMonth && (
        <Card title={`Comparison: ${report.month} vs ${report.previousMonth.month}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Current Month</h3>
              <ComparisonList report={report} />
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Previous Month</h3>
              <ComparisonList report={report.previousMonth} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Fraud & Audit
// ═══════════════════════════════════════════════════════════════════════════════

interface FraudTabProps {
  data: ReturnType<typeof useFraudDashboard>['data'];
  loading: boolean;
  error: string;
  days: number;
}

function FraudTab({ data, loading, error, days }: FraudTabProps): JSX.Element {
  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!data) return <div className="text-gray-500 text-center py-8">No fraud data available</div>;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Alerts"
          value={String(data.summary.totalAlerts)}
          icon="🚨"
          className={data.summary.totalAlerts > 0 ? 'border-2 border-red-200' : ''}
        />
        <StatCard
          title="High Severity"
          value={String(data.summary.highSeverityCount)}
          icon="🔴"
          className={data.summary.highSeverityCount > 0 ? 'border-2 border-red-300 bg-red-50' : ''}
        />
        <StatCard
          title="Medium Severity"
          value={String(data.summary.mediumSeverityCount)}
          icon="🟡"
        />
        <StatCard
          title="Staff Flagged"
          value={String(data.summary.staffWithFlags)}
          icon="👤"
          subtitle={`of ${data.staffActivities.length} total`}
        />
        <StatCard
          title="Stock Issues"
          value={String(data.summary.stockDiscrepancyCount)}
          icon="📦"
        />
      </div>

      {/* Daily Revenue Anomaly Chart */}
      {data.dailyAnomalies.length > 0 && (
        <Card title="📈 Daily Revenue Anomaly Detection">
          <p className="text-sm text-gray-500 mb-4">
            Days marked in red deviate more than 2 standard deviations from the average revenue.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.dailyAnomalies.map((d) => ({
                date: formatShortDate(d.date),
                revenue: d.revenueCents / 100,
                avg: d.avgRevenueCents / 100,
                isAnomaly: d.isAnomaly,
                reason: d.anomalyReason,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as {
                    revenue: number;
                    avg: number;
                    isAnomaly: boolean;
                    reason?: string;
                  };
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
                      <p className="font-medium">{label}</p>
                      <p className="text-emerald-600">Revenue: ฿{item.revenue.toFixed(2)}</p>
                      <p className="text-gray-500">Average: ฿{item.avg.toFixed(2)}</p>
                      {item.isAnomaly && (
                        <p className="text-red-600 font-medium mt-1">{item.reason}</p>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={data.dailyAnomalies[0]?.avgRevenueCents / 100}
                stroke="#6b7280"
                strokeDasharray="5 5"
                label={{ value: 'Avg', position: 'right', fontSize: 11, fill: '#6b7280' }}
              />
              <Bar dataKey="revenue" name="Revenue (฿)" radius={[4, 4, 0, 0]}>
                {data.dailyAnomalies.map((entry, idx) => (
                  <rect key={idx} fill={entry.isAnomaly ? '#ef4444' : '#059669'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Staff Activity Table */}
      <Card title="👥 Staff Activity Monitor">
        <p className="text-sm text-gray-500 mb-4">
          Activity breakdown per staff member over the selected date range ({days} days). Flagged issues are highlighted.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-500">Staff</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500">Role</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Sales</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Revenue</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Avg Order</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Stock Entries</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Expenses</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500">Flags</th>
              </tr>
            </thead>
            <tbody>
              {data.staffActivities.map((staff) => (
                <StaffRow key={staff.userId} staff={staff} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Discrepancies */}
      {data.stockDiscrepancies.length > 0 && (
        <Card title="📦 Stock Discrepancies" className="border-2 border-amber-200">
          <p className="text-sm text-gray-500 mb-4">
            Products where calculated stock doesn't match recorded values.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Product</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Total Stocked</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Total Sold</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Expected Remaining</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Actual Remaining</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Discrepancy</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500">Severity</th>
                </tr>
              </thead>
              <tbody>
                {data.stockDiscrepancies.map((disc) => (
                  <StockRow key={disc.productId} disc={disc} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* All Alerts */}
      {data.alerts.length > 0 && (
        <Card title="🚨 All Fraud Alerts">
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </Card>
      )}

      {/* All Clear */}
      {data.summary.totalAlerts === 0 &&
        data.summary.staffWithFlags === 0 &&
        data.summary.stockDiscrepancyCount === 0 && (
          <Card>
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">✅</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">All Clear</h3>
              <p className="text-gray-500">
                No fraud alerts, staff flags, or stock discrepancies detected in the selected period.
              </p>
            </div>
          </Card>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared Sub-Components
// ═══════════════════════════════════════════════════════════════════════════════

// ── Expense Row (Overview tab) ──────────────────────────────────────────────
function ExpenseRow({
  label,
  amount,
  color,
  total,
}: {
  label: string;
  amount: number;
  color: string;
  total: number;
}): JSX.Element {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {formatCurrency(amount)} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ── P&L Row (Profit & Loss tab) ─────────────────────────────────────────────
function PLRow({
  label,
  amount,
  bold,
  indent,
  highlight,
  className = '',
}: {
  label: string;
  amount: number;
  bold?: boolean;
  indent?: boolean;
  highlight?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <div className={`flex justify-between items-center ${indent ? 'pl-6' : ''} ${highlight ? 'bg-gray-50 p-2 rounded-lg' : ''}`}>
      <span className={`${bold ? 'font-semibold' : 'text-gray-600'} text-sm`}>{label}</span>
      <span className={`${bold ? 'font-bold text-lg' : 'font-medium'} ${className}`}>
        {formatCurrency(Math.abs(amount))}
        {amount < 0 && <span className="text-red-400 ml-1 text-xs">(deducted)</span>}
      </span>
    </div>
  );
}

// ── Comparison List (Profit & Loss tab) ─────────────────────────────────────
function ComparisonList({ report }: { report: MonthlyReport }): JSX.Element {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span>Revenue</span><span>{formatCurrency(report.revenueCents)}</span></div>
      <div className="flex justify-between"><span>COGS</span><span>{formatCurrency(report.cogsCents)}</span></div>
      <div className="flex justify-between"><span>Labor</span><span>{formatCurrency(report.laborCents)}</span></div>
      <div className="flex justify-between"><span>Utilities</span><span>{formatCurrency(report.utilityCents)}</span></div>
      <div className="flex justify-between"><span>Other</span><span>{formatCurrency(report.otherExpensesCents)}</span></div>
      <div className="flex justify-between font-bold border-t pt-2">
        <span>Net Profit</span>
        <span className={report.netProfitCents >= 0 ? 'text-emerald-600' : 'text-red-500'}>
          {formatCurrency(report.netProfitCents)}
        </span>
      </div>
    </div>
  );
}

// ── Staff Row (Fraud tab) ───────────────────────────────────────────────────
function StaffRow({ staff }: { staff: StaffActivity }): JSX.Element {
  const hasFlags = staff.flags.length > 0;
  return (
    <>
      <tr className={`border-b border-gray-100 ${hasFlags ? 'bg-red-50' : ''}`}>
        <td className="py-3 px-3 font-medium text-gray-900">{staff.username}</td>
        <td className="py-3 px-3">
          <Badge variant={staff.role === 'OWNER' ? 'warning' : 'info'}>{staff.role}</Badge>
        </td>
        <td className="py-3 px-3 text-right">{staff.salesCount}</td>
        <td className="py-3 px-3 text-right font-medium text-emerald-600">
          {formatCurrency(staff.totalRevenueCents)}
        </td>
        <td className="py-3 px-3 text-right">{formatCurrency(staff.avgOrderValueCents)}</td>
        <td className="py-3 px-3 text-right">{staff.stockEntriesCount}</td>
        <td className="py-3 px-3 text-right">
          {staff.expensesRecordedCount} ({formatCurrency(staff.totalExpensesCents)})
        </td>
        <td className="py-3 px-3">
          {hasFlags ? (
            <div className="flex flex-wrap gap-1">
              {staff.flags.map((flag, idx) => (
                <Badge
                  key={idx}
                  variant={flag.severity === 'HIGH' ? 'danger' : flag.severity === 'MEDIUM' ? 'warning' : 'neutral'}
                >
                  {formatFlagType(flag.type)}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-xs">None</span>
          )}
        </td>
      </tr>
      {hasFlags && (
        <tr className="bg-red-50">
          <td colSpan={8} className="px-3 pb-3">
            <div className="ml-4 space-y-1">
              {staff.flags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <SeverityDot severity={flag.severity} />
                  <span className="text-gray-700">{flag.description}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Stock Row (Fraud tab) ───────────────────────────────────────────────────
function StockRow({ disc }: { disc: StockDiscrepancy }): JSX.Element {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-3 font-medium text-gray-900">{disc.productName}</td>
      <td className="py-3 px-3 text-right">{disc.totalStocked}</td>
      <td className="py-3 px-3 text-right">{disc.totalSold}</td>
      <td className="py-3 px-3 text-right">{disc.expectedRemaining}</td>
      <td className="py-3 px-3 text-right">{disc.actualRemaining}</td>
      <td className={`py-3 px-3 text-right font-bold ${disc.discrepancy > 0 ? 'text-red-600' : disc.discrepancy < 0 ? 'text-amber-600' : 'text-gray-400'}`}>
        {disc.discrepancy > 0 ? '+' : ''}{disc.discrepancy}
      </td>
      <td className="py-3 px-3 text-center">
        <Badge variant={disc.severity === 'HIGH' ? 'danger' : disc.severity === 'MEDIUM' ? 'warning' : 'neutral'}>
          {disc.severity}
        </Badge>
      </td>
    </tr>
  );
}

// ── Alert Row (Fraud tab) ───────────────────────────────────────────────────
function AlertRow({ alert }: { alert: FraudAlert }): JSX.Element {
  const typeLabels: Record<string, string> = {
    STOCK_DEFICIT: 'Stock Deficit',
    STOCK_MISMATCH: 'Stock Mismatch',
    REVENUE_MISMATCH: 'Revenue Mismatch',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg ${
        alert.severity === 'HIGH'
          ? 'bg-red-50 border border-red-200'
          : alert.severity === 'MEDIUM'
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <SeverityDot severity={alert.severity} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={alert.severity === 'HIGH' ? 'danger' : alert.severity === 'MEDIUM' ? 'warning' : 'neutral'}>
            {alert.severity}
          </Badge>
          <span className="text-sm font-medium text-gray-700">{typeLabels[alert.type] ?? alert.type}</span>
        </div>
        <p className="text-sm text-gray-600">{alert.description}</p>
        {alert.affectedDateRange.from && (
          <p className="text-xs text-gray-400 mt-1">
            Date range: {formatDate(alert.affectedDateRange.from)}
            {alert.affectedDateRange.to && alert.affectedDateRange.to !== alert.affectedDateRange.from
              ? ` – ${formatDate(alert.affectedDateRange.to)}`
              : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Severity Dot ────────────────────────────────────────────────────────────
function SeverityDot({ severity }: { severity: FraudSeverity }): JSX.Element {
  const color =
    severity === 'HIGH' ? 'bg-red-500' :
    severity === 'MEDIUM' ? 'bg-amber-500' :
    'bg-gray-400';
  return <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${color}`} />;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatFlagType(type: string): string {
  const labels: Record<string, string> = {
    HIGH_VOID_RATE: 'High Voids',
    UNUSUAL_DISCOUNT: 'Discount',
    ODD_HOURS: 'Odd Hours',
    HIGH_EXPENSE: 'High Expense',
    STOCK_ANOMALY: 'Stock Anomaly',
  };
  return labels[type] ?? type;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
