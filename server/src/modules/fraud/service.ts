import { Op, fn, col, literal } from 'sequelize';
import { Sale, StockEntry, Product, Expense, User } from '../../models';
import type {
  FraudAlert,
  FraudDashboard,
  StaffActivity,
  StaffFlag,
  StockDiscrepancy,
  DailyAnomalyPoint,
} from '@coco/shared';

export async function detectFraudAlerts(): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = [];
  const products = await Product.findAll({ where: { isActive: true } });
  const now = new Date().toISOString();

  for (const product of products) {
    const totalStocked =
      (await StockEntry.sum('quantityAdded', { where: { productId: product.id } })) || 0;

    const totalSold =
      (await Sale.sum('quantity', { where: { productId: product.id } })) || 0;

    const currentRemaining =
      (await StockEntry.sum('quantityRemaining', { where: { productId: product.id } })) || 0;

    // Rule 1: Sold more than stocked
    if (totalSold > totalStocked) {
      const discrepancy = totalSold - totalStocked;
      alerts.push({
        id: generateId(),
        severity: discrepancy > 10 ? 'HIGH' : discrepancy > 5 ? 'MEDIUM' : 'LOW',
        type: 'STOCK_DEFICIT',
        description: `${product.name}: Sold ${totalSold} but only ${totalStocked} were stocked (${discrepancy} unaccounted)`,
        detectedAt: now,
        affectedDateRange: { from: '', to: '' },
        relatedRecordIds: [product.id],
      });
    }

    // Rule 2: Remaining stock doesn't match calculation
    const expectedRemaining = totalStocked - totalSold;
    if (currentRemaining !== expectedRemaining && expectedRemaining >= 0) {
      alerts.push({
        id: generateId(),
        severity: 'MEDIUM',
        type: 'STOCK_MISMATCH',
        description: `${product.name}: Expected ${expectedRemaining} remaining but found ${currentRemaining} in stock records`,
        detectedAt: now,
        affectedDateRange: { from: '', to: '' },
        relatedRecordIds: [product.id],
      });
    }

    // Rule 3: Revenue cross-check per product
    const sales = await Sale.findAll({ where: { productId: product.id } });
    for (const sale of sales) {
      const expectedTotal = sale.quantity * sale.unitPriceCents;
      if (sale.totalCents !== expectedTotal) {
        alerts.push({
          id: generateId(),
          severity: 'HIGH',
          type: 'REVENUE_MISMATCH',
          description: `${product.name}: Sale #${sale.id} total is ${sale.totalCents} cents but expected ${expectedTotal} (qty ${sale.quantity} × ${sale.unitPriceCents})`,
          detectedAt: now,
          affectedDateRange: { from: sale.saleDate, to: sale.saleDate },
          relatedRecordIds: [sale.id],
        });
      }
    }
  }

  return alerts.sort((a, b) => {
    const severity = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return severity[a.severity] - severity[b.severity];
  });
}

/**
 * Complete fraud dashboard with staff activity, stock discrepancies, daily anomalies.
 */
export async function getFraudDashboard(days: number = 30): Promise<FraudDashboard> {
  const alerts = await detectFraudAlerts();
  const staffActivities = await getStaffActivities(days);
  const stockDiscrepancies = await getStockDiscrepancies();
  const dailyAnomalies = await getDailyAnomalies(days);

  const highSeverityCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const mediumSeverityCount = alerts.filter((a) => a.severity === 'MEDIUM').length;
  const lowSeverityCount = alerts.filter((a) => a.severity === 'LOW').length;
  const staffWithFlags = staffActivities.filter((s) => s.flags.length > 0).length;

  return {
    alerts,
    staffActivities,
    stockDiscrepancies,
    dailyAnomalies,
    summary: {
      totalAlerts: alerts.length,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
      staffWithFlags,
      stockDiscrepancyCount: stockDiscrepancies.length,
    },
  };
}

/**
 * Analyze each staff member's activity looking for anomalies.
 */
async function getStaffActivities(days: number): Promise<StaffActivity[]> {
  const startDate = getDateDaysAgo(days);
  const users = await User.findAll();

  const activities: StaffActivity[] = [];

  for (const user of users) {
    const sales = await Sale.findAll({
      where: {
        recordedBy: user.id,
        saleDate: { [Op.gte]: startDate },
      },
    });

    const stockEntries = await StockEntry.findAll({
      where: {
        recordedBy: user.id,
        entryDate: { [Op.gte]: startDate },
      },
    });

    const expenses = await Expense.findAll({
      where: {
        recordedBy: user.id,
        expenseDate: { [Op.gte]: startDate },
      },
    });

    const salesCount = sales.length;
    const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);
    const avgOrderValueCents = salesCount > 0 ? Math.round(totalRevenueCents / salesCount) : 0;
    const totalExpensesCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

    const flags: StaffFlag[] = [];

    // Flag: Unusually high expenses relative to their sales
    if (totalExpensesCents > 0 && totalRevenueCents > 0) {
      const expenseRatio = totalExpensesCents / totalRevenueCents;
      if (expenseRatio > 0.8) {
        flags.push({
          type: 'HIGH_EXPENSE',
          severity: expenseRatio > 1.5 ? 'HIGH' : 'MEDIUM',
          description: `Expenses recorded (${formatCentsToBaht(totalExpensesCents)}) are ${Math.round(expenseRatio * 100)}% of sales revenue`,
        });
      }
    }

    // Flag: Check for selling below standard price
    for (const sale of sales) {
      const product = await Product.findByPk(sale.productId);
      if (product && sale.unitPriceCents < product.sellingPriceCents) {
        const discount = Math.round(
          ((product.sellingPriceCents - sale.unitPriceCents) / product.sellingPriceCents) * 100,
        );
        if (discount >= 10) {
          flags.push({
            type: 'UNUSUAL_DISCOUNT',
            severity: discount > 30 ? 'HIGH' : 'MEDIUM',
            description: `Sold ${product.name} at ${formatCentsToBaht(sale.unitPriceCents)} (${discount}% below standard price ${formatCentsToBaht(product.sellingPriceCents)}) on ${sale.saleDate}`,
          });
        }
      }
    }

    // Flag: Stock entries without corresponding sales (potential phantom stock)
    if (stockEntries.length > 0 && salesCount === 0 && user.role === 'STAFF') {
      flags.push({
        type: 'STOCK_ANOMALY',
        severity: 'MEDIUM',
        description: `Added ${stockEntries.length} stock entries but recorded 0 sales in the last ${days} days`,
      });
    }

    activities.push({
      userId: user.id,
      username: user.username,
      role: user.role,
      salesCount,
      totalRevenueCents,
      avgOrderValueCents,
      stockEntriesCount: stockEntries.length,
      expensesRecordedCount: expenses.length,
      totalExpensesCents,
      deletedSalesCount: 0, // Would need soft-delete or audit log to track
      flags,
    });
  }

  // Sort: staff with flags first, then by total revenue descending
  return activities.sort((a, b) => {
    if (a.flags.length !== b.flags.length) return b.flags.length - a.flags.length;
    return b.totalRevenueCents - a.totalRevenueCents;
  });
}

/**
 * Get per-product stock discrepancies.
 */
async function getStockDiscrepancies(): Promise<StockDiscrepancy[]> {
  const products = await Product.findAll({ where: { isActive: true } });
  const discrepancies: StockDiscrepancy[] = [];

  for (const product of products) {
    const totalStocked =
      (await StockEntry.sum('quantityAdded', { where: { productId: product.id } })) || 0;
    const totalSold =
      (await Sale.sum('quantity', { where: { productId: product.id } })) || 0;
    const actualRemaining =
      (await StockEntry.sum('quantityRemaining', { where: { productId: product.id } })) || 0;

    const expectedRemaining = totalStocked - totalSold;
    const discrepancy = actualRemaining - expectedRemaining;

    if (discrepancy !== 0 || totalSold > totalStocked) {
      const absDisc = Math.abs(totalSold > totalStocked ? totalSold - totalStocked : discrepancy);
      discrepancies.push({
        productId: product.id,
        productName: product.name,
        totalStocked,
        totalSold,
        expectedRemaining: Math.max(expectedRemaining, 0),
        actualRemaining,
        discrepancy: totalSold > totalStocked ? totalSold - totalStocked : discrepancy,
        severity: absDisc > 10 ? 'HIGH' : absDisc > 3 ? 'MEDIUM' : 'LOW',
      });
    }
  }

  return discrepancies.sort((a, b) => {
    const sev = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

/**
 * Detect daily revenue anomalies — days that deviate significantly from the average.
 */
async function getDailyAnomalies(days: number): Promise<DailyAnomalyPoint[]> {
  const startDate = getDateDaysAgo(days);

  // Get all days with sales
  const sales = await Sale.findAll({
    where: { saleDate: { [Op.gte]: startDate } },
    order: [['saleDate', 'ASC']],
  });

  // Group by date
  const byDate: Record<string, { revenueCents: number; count: number }> = {};
  for (const sale of sales) {
    if (!byDate[sale.saleDate]) {
      byDate[sale.saleDate] = { revenueCents: 0, count: 0 };
    }
    byDate[sale.saleDate].revenueCents += sale.totalCents;
    byDate[sale.saleDate].count += 1;
  }

  const dates = Object.keys(byDate).sort();
  if (dates.length === 0) return [];

  // Calculate average
  const totalRevenue = dates.reduce((sum, d) => sum + byDate[d].revenueCents, 0);
  const avgRevenueCents = Math.round(totalRevenue / dates.length);

  // Standard deviation
  const variance =
    dates.reduce((sum, d) => sum + Math.pow(byDate[d].revenueCents - avgRevenueCents, 2), 0) /
    dates.length;
  const stdDev = Math.sqrt(variance);

  // Mark anomalies (> 2 standard deviations from mean)
  const threshold = 2;

  return dates.map((date) => {
    const { revenueCents, count } = byDate[date];
    const zScore = stdDev > 0 ? (revenueCents - avgRevenueCents) / stdDev : 0;
    const isAnomaly = Math.abs(zScore) > threshold;
    let anomalyReason: string | undefined;

    if (isAnomaly) {
      if (zScore > 0) {
        anomalyReason = `Revenue ${Math.round(zScore * 100) / 100}σ above average — unusually high day`;
      } else {
        anomalyReason = `Revenue ${Math.round(Math.abs(zScore) * 100) / 100}σ below average — unusually low day`;
      }
    }

    return {
      date,
      revenueCents,
      salesCount: count,
      avgRevenueCents,
      isAnomaly,
      anomalyReason,
    };
  });
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function formatCentsToBaht(cents: number): string {
  return `฿${(cents / 100).toFixed(2)}`;
}

function generateId(): string {
  return `fraud-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
