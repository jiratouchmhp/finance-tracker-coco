import { useState } from 'react';
import { salesApi, productApi } from '../services/api';
import { useSalesData } from '../hooks/useSalesData';
import { useSalesAnalytics } from '../hooks/useSalesAnalytics';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { formatCurrency, formatDate, getToday, getPeriodLabel } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Sale, TimePeriod } from '@coco/shared';
import { JSX } from 'react';

const PIE_COLORS = ['#059669', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Sales(): JSX.Element {
  const [period, setPeriod] = useState<TimePeriod>('daily');
  const [referenceDate, setReferenceDate] = useState(getToday());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Form state (daily mode only)
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const customRange = period === 'custom' && startDate && endDate && endDate >= startDate
    ? { startDate, endDate }
    : undefined;

  const { data: salesData, loading, error: loadError, reload } = useSalesData(period, referenceDate, customRange);
  const { data: analytics } = useSalesAnalytics(period, referenceDate, customRange);

  const products = salesData?.products ?? [];
  const sales = salesData?.sales ?? [];
  const selectedProduct = products.find((p) => p.id === Number(productId));

  const displayError = error || loadError;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;
    setSubmitting(true);
    setError('');

    try {
      await salesApi.create({
        productId: Number(productId),
        quantity: Number(quantity),
        unitPriceCents: selectedProduct.sellingPriceCents,
        saleDate: referenceDate,
      });
      setProductId('');
      setQuantity('');
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm('Delete this sale record?')) return;
    try {
      await salesApi.delete(id);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete sale');
    }
  }

  const totalCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (s: Record<string, unknown>) => {
        const sale = s as unknown as Sale;
        return sale.product?.name || `Product #${sale.productId}`;
      },
    },
    ...(period !== 'daily'
      ? [{
          key: 'saleDate',
          header: 'Date',
          render: (s: Record<string, unknown>) => formatDate((s as unknown as Sale).saleDate),
        }]
      : []),
    { key: 'quantity', header: 'Qty' },
    {
      key: 'unitPriceCents',
      header: 'Unit Price',
      render: (s: Record<string, unknown>) => formatCurrency((s as unknown as Sale).unitPriceCents),
    },
    {
      key: 'totalCents',
      header: 'Total',
      render: (s: Record<string, unknown>) => (
        <span className="font-medium text-emerald-600">{formatCurrency((s as unknown as Sale).totalCents)}</span>
      ),
    },
    ...(period === 'daily'
      ? [{
          key: 'actions',
          header: '',
          render: (s: Record<string, unknown>) => (
            <button
              onClick={() => handleDelete((s as unknown as Sale).id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 text-sm">{getPeriodLabel(period, referenceDate, customRange)}</p>
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        referenceDate={referenceDate}
        onDateChange={setReferenceDate}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {displayError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{displayError}</div>}

      {/* Analytics Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(analytics.totalRevenueCents)}
            icon="💰"
            subtitle={`${analytics.totalSalesCount} sales`}
            trend={analytics.revenueChangePct}
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(analytics.avgOrderValueCents)}
            icon="🧮"
            subtitle="per transaction"
          />
          <StatCard
            title="Avg Units / Sale"
            value={String(analytics.avgUnitsPerSale)}
            icon="📦"
            subtitle="units per transaction"
          />
          <StatCard
            title="vs Previous Period"
            value={formatCurrency(analytics.previousPeriodRevenueCents)}
            icon={analytics.revenueChangePct >= 0 ? '📈' : '📉'}
            trend={analytics.revenueChangePct}
            subtitle="previous period revenue"
          />
        </div>
      )}

      {/* Record Sale Form — daily mode only */}
      {period === 'daily' && (
        <Card title="Record Sale">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select
              label="Product"
              options={products.map((p) => ({ value: String(p.id), label: `${p.name} (${formatCurrency(p.sellingPriceCents)})` }))}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <div>
              <p className="text-sm text-gray-500 mb-1">Total</p>
              <p className="text-lg font-bold text-emerald-600">
                {selectedProduct && quantity
                  ? formatCurrency(selectedProduct.sellingPriceCents * Number(quantity))
                  : '฿0.00'}
              </p>
            </div>
            <Button type="submit" disabled={submitting || !productId || !quantity}>
              {submitting ? 'Recording...' : 'Record Sale'}
            </Button>
          </form>
        </Card>
      )}

      {/* Charts — weekly/monthly analytics */}
      {analytics && analytics.trendData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <Card title="Sales Trend">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.trendData.map((t) => ({
                name: t.label,
                revenue: t.revenueCents / 100,
                sales: t.count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number, name: string) =>
                  name === 'revenue' ? `฿${value.toFixed(2)}` : value
                } />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (฿)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="sales" name="# Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Product Breakdown Pie */}
          <Card title="Revenue by Product">
            {analytics.productBreakdown.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={analytics.productBreakdown.map((p) => ({
                        name: p.productName,
                        value: p.revenueCents / 100,
                        pct: p.percentage,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, pct }) => `${name} ${pct}%`}
                    >
                      {analytics.productBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `฿${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {analytics.productBreakdown.map((p, idx) => (
                    <div key={p.productName} className="flex items-center gap-1.5 text-sm">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-600">{p.productName}</span>
                      <span className="text-gray-400">({p.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales data</p>
            )}
          </Card>
        </div>
      )}

      {/* Top Products Ranking */}
      {analytics && analytics.topProducts.length > 0 && (
        <Card title="Top Products Ranking">
          <div className="space-y-3">
            {analytics.topProducts.slice(0, 5).map((product, index) => {
              const maxRevenue = analytics.topProducts[0].totalRevenueCents;
              const barWidth = maxRevenue > 0 ? (product.totalRevenueCents / maxRevenue) * 100 : 0;
              return (
                <div key={product.productName} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{product.productName}</span>
                      <span className="text-sm font-semibold text-emerald-600 ml-2">
                        {formatCurrency(product.totalRevenueCents)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{product.totalQuantity} sold</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Sales Table */}
      <Card title={`Sales Records — ${getPeriodLabel(period, referenceDate, customRange)}`}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <DataTable columns={columns} data={sales as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="No sales recorded for this period" />
            {sales.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Revenue</span>
                <span className="text-xl font-bold text-emerald-600">{formatCurrency(totalCents)}</span>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
