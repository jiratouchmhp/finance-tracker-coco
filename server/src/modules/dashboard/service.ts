import { Op, fn, col, literal } from 'sequelize';
import { Sale, Expense, Product, StockEntry, DailySummary } from '../../models';
import type { DashboardDaily, DashboardMonthly, DashboardWeekly, DashboardCustomRange, MonthlyReport } from '@coco/shared';
import { getWeekRange } from '../../utils/date-range';

export async function getDailySummary(date: string): Promise<DashboardDaily> {
  const sales = await Sale.findAll({
    where: { saleDate: date },
    include: [{ model: Product, as: 'product' }],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  // Calculate COGS: sum of cost price * quantity for each sale
  let totalCogsCents = 0;
  const productSales: Record<string, { productName: string; quantity: number; totalCents: number }> = {};

  for (const sale of sales) {
    const product = (sale as Sale & { product: Product }).product;
    if (product) {
      totalCogsCents += (product.costPriceCents + product.packagingCostCents) * sale.quantity;
      const key = String(product.id);
      if (!productSales[key]) {
        productSales[key] = { productName: product.name, quantity: 0, totalCents: 0 };
      }
      productSales[key].quantity += sale.quantity;
      productSales[key].totalCents += sale.totalCents;
    }
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  // Only variable expenses for the day (fixed costs like LABOR/UTILITY are monthly)
  const expenses = await Expense.findAll({
    where: {
      expenseDate: date,
      category: { [Op.in]: ['INGREDIENT', 'OTHER'] },
    },
  });

  const totalLaborCents = 0; // Fixed costs excluded from daily view
  let totalOtherExpensesCents = 0;

  for (const exp of expenses) {
    totalOtherExpensesCents += exp.amountCents;
  }

  const netProfitCents =
    totalRevenueCents - totalCogsCents - totalLaborCents - totalOtherExpensesCents;

  // Count fraud alerts (stock discrepancies)
  const fraudAlertCount = await countStockDiscrepancies();

  return {
    date,
    totalRevenueCents,
    totalCogsCents,
    totalLaborCents,
    totalOtherExpensesCents,
    netProfitCents,
    salesCount: sales.length,
    topProducts,
    fraudAlertCount,
  };
}

export async function getWeeklySummary(date: string): Promise<DashboardWeekly> {
  const { start, end } = getWeekRange(date);

  const sales = await Sale.findAll({
    where: { saleDate: { [Op.gte]: start, [Op.lt]: end } },
    include: [{ model: Product, as: 'product' }],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  let totalCogsCents = 0;
  const productSales: Record<string, { productName: string; quantity: number; totalCents: number }> = {};

  for (const sale of sales) {
    const product = (sale as Sale & { product: Product }).product;
    if (product) {
      totalCogsCents += (product.costPriceCents + product.packagingCostCents) * sale.quantity;
      const key = String(product.id);
      if (!productSales[key]) {
        productSales[key] = { productName: product.name, quantity: 0, totalCents: 0 };
      }
      productSales[key].quantity += sale.quantity;
      productSales[key].totalCents += sale.totalCents;
    }
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  // Only variable expenses for the week (fixed costs are monthly)
  const expenses = await Expense.findAll({
    where: {
      expenseDate: { [Op.gte]: start, [Op.lt]: end },
      category: { [Op.in]: ['INGREDIENT', 'OTHER'] },
    },
  });

  const totalLaborCents = 0; // Fixed costs excluded from weekly view
  let totalOtherExpensesCents = 0;

  for (const exp of expenses) {
    totalOtherExpensesCents += exp.amountCents;
  }

  const netProfitCents =
    totalRevenueCents - totalCogsCents - totalLaborCents - totalOtherExpensesCents;

  const fraudAlertCount = await countStockDiscrepancies();

  // weekEnd = last day of the week (Sunday), i.e. end date minus 1 day
  const endDate = new Date(end + 'T00:00:00');
  endDate.setDate(endDate.getDate() - 1);
  const weekEnd = endDate.toISOString().split('T')[0];

  return {
    weekStart: start,
    weekEnd,
    totalRevenueCents,
    totalCogsCents,
    totalLaborCents,
    totalOtherExpensesCents,
    netProfitCents,
    salesCount: sales.length,
    topProducts,
    fraudAlertCount,
  };
}

export async function getMonthlySummary(month: string): Promise<DashboardMonthly> {
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const endDate = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

  const sales = await Sale.findAll({
    where: { saleDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
    include: [{ model: Product, as: 'product' }],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  let totalCogsCents = 0;
  for (const sale of sales) {
    const product = (sale as Sale & { product: Product }).product;
    if (product) {
      totalCogsCents += (product.costPriceCents + product.packagingCostCents) * sale.quantity;
    }
  }

  const expenses = await Expense.findAll({
    where: { expenseDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
  });

  let totalLaborCents = 0;
  let totalUtilityCents = 0;
  let totalOtherExpensesCents = 0;

  for (const exp of expenses) {
    switch (exp.category) {
      case 'LABOR':
        totalLaborCents += exp.amountCents;
        break;
      case 'UTILITY':
        totalUtilityCents += exp.amountCents;
        break;
      default:
        totalOtherExpensesCents += exp.amountCents;
        break;
    }
  }

  const grossProfitCents = totalRevenueCents - totalCogsCents;
  const netProfitCents =
    grossProfitCents - totalLaborCents - totalUtilityCents - totalOtherExpensesCents;

  const dailySummaryRows = await DailySummary.findAll({
    where: { date: { [Op.gte]: startDate, [Op.lt]: endDate } },
    order: [['date', 'ASC']],
  });

  const dailySummaries = dailySummaryRows.map((ds) => ({
    id: ds.id,
    date: ds.date,
    totalRevenueCents: ds.totalRevenueCents,
    totalCogsCents: ds.totalCogsCents,
    totalLaborCents: ds.totalLaborCents,
    totalExpensesCents: ds.totalExpensesCents,
    netProfitCents: ds.netProfitCents,
    salesCount: ds.salesCount,
    generatedAt: ds.generatedAt instanceof Date ? ds.generatedAt.toISOString() : String(ds.generatedAt),
  }));

  return {
    month,
    totalRevenueCents,
    totalCogsCents,
    totalLaborCents,
    totalUtilityCents,
    totalOtherExpensesCents,
    grossProfitCents,
    netProfitCents,
    dailySummaries,
  };
}

export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const summary = await getMonthlySummary(month);

  const totalExpensesCents =
    summary.totalLaborCents + summary.totalUtilityCents + summary.totalOtherExpensesCents;

  // Get previous month for comparison
  const [year, mon] = month.split('-').map(Number);
  const prevMonth = mon === 1
    ? `${year - 1}-12`
    : `${year}-${String(mon - 1).padStart(2, '0')}`;

  let previousMonth: MonthlyReport | undefined;
  try {
    const prevSummary = await getMonthlySummary(prevMonth);
    const prevTotalExpenses =
      prevSummary.totalLaborCents + prevSummary.totalUtilityCents + prevSummary.totalOtherExpensesCents;
    previousMonth = {
      month: prevMonth,
      revenueCents: prevSummary.totalRevenueCents,
      cogsCents: prevSummary.totalCogsCents,
      grossProfitCents: prevSummary.grossProfitCents,
      laborCents: prevSummary.totalLaborCents,
      utilityCents: prevSummary.totalUtilityCents,
      otherExpensesCents: prevSummary.totalOtherExpensesCents,
      totalExpensesCents: prevTotalExpenses,
      netProfitCents: prevSummary.netProfitCents,
    };
  } catch {
    // No previous month data available
  }

  return {
    month,
    revenueCents: summary.totalRevenueCents,
    cogsCents: summary.totalCogsCents,
    grossProfitCents: summary.grossProfitCents,
    laborCents: summary.totalLaborCents,
    utilityCents: summary.totalUtilityCents,
    otherExpensesCents: summary.totalOtherExpensesCents,
    totalExpensesCents,
    netProfitCents: summary.netProfitCents,
    previousMonth,
  };
}

async function countStockDiscrepancies(): Promise<number> {
  const products = await Product.findAll({ where: { isActive: true } });
  let count = 0;

  for (const product of products) {
    const totalStocked = await StockEntry.sum('quantityAdded', {
      where: { productId: product.id },
    }) || 0;

    const totalSold = await Sale.sum('quantity', {
      where: { productId: product.id },
    }) || 0;

    if (totalSold > totalStocked) {
      count++;
    }
  }

  return count;
}

export async function getCustomRangeSummary(
  startDate: string,
  endDate: string,
): Promise<DashboardCustomRange> {
  // endDate is inclusive from the user's perspective; make it exclusive for queries
  const endExclusive = new Date(endDate + 'T00:00:00');
  endExclusive.setDate(endExclusive.getDate() + 1);
  const endExclusiveStr = endExclusive.toISOString().split('T')[0];

  const sales = await Sale.findAll({
    where: { saleDate: { [Op.gte]: startDate, [Op.lt]: endExclusiveStr } },
    include: [{ model: Product, as: 'product' }],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  let totalCogsCents = 0;
  const productSales: Record<string, { productName: string; quantity: number; totalCents: number }> = {};

  for (const sale of sales) {
    const product = (sale as Sale & { product: Product }).product;
    if (product) {
      totalCogsCents += (product.costPriceCents + product.packagingCostCents) * sale.quantity;
      const key = String(product.id);
      if (!productSales[key]) {
        productSales[key] = { productName: product.name, quantity: 0, totalCents: 0 };
      }
      productSales[key].quantity += sale.quantity;
      productSales[key].totalCents += sale.totalCents;
    }
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  // Only variable expenses for the range (fixed costs are monthly)
  const expenses = await Expense.findAll({
    where: {
      expenseDate: { [Op.gte]: startDate, [Op.lt]: endExclusiveStr },
      category: { [Op.in]: ['INGREDIENT', 'OTHER'] },
    },
  });

  const totalLaborCents = 0; // Fixed costs excluded from custom range view
  let totalOtherExpensesCents = 0;

  for (const exp of expenses) {
    totalOtherExpensesCents += exp.amountCents;
  }

  const netProfitCents =
    totalRevenueCents - totalCogsCents - totalLaborCents - totalOtherExpensesCents;

  const fraudAlertCount = await countStockDiscrepancies();

  return {
    startDate,
    endDate,
    totalRevenueCents,
    totalCogsCents,
    totalLaborCents,
    totalOtherExpensesCents,
    netProfitCents,
    salesCount: sales.length,
    topProducts,
    fraudAlertCount,
  };
}
