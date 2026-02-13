import { Op } from 'sequelize';
import { Sale, Product, StockEntry } from '../../models';
import { sequelize } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPeriodRange, getPreviousPeriodRange, enumerateDays } from '../../utils/date-range';
import type { TimePeriod, SalesAnalytics, SalesTrendPoint, TopProductRanking, ProductBreakdown } from '@coco/shared';

export async function createSale(data: {
  productId: number;
  quantity: number;
  unitPriceCents: number;
  saleDate: string;
  recordedBy: number;
}): Promise<Sale> {
  const product = await Product.findByPk(data.productId);
  if (!product) throw new AppError('Product not found', 404);

  const totalCents = data.quantity * data.unitPriceCents;

  const sale = await Sale.create({
    productId: data.productId,
    quantity: data.quantity,
    unitPriceCents: data.unitPriceCents,
    totalCents,
    saleDate: data.saleDate,
    recordedBy: data.recordedBy,
  });

  // Deduct from the oldest stock entries (FIFO)
  let remaining = data.quantity;
  const stockEntries = await StockEntry.findAll({
    where: { productId: data.productId, quantityRemaining: { [Op.gt]: 0 } },
    order: [['entryDate', 'ASC'], ['id', 'ASC']],
  });

  for (const entry of stockEntries) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, entry.quantityRemaining);
    await entry.update({ quantityRemaining: entry.quantityRemaining - deduct });
    remaining -= deduct;
  }

  return sale;
}

export async function getSalesByDate(date: string): Promise<Sale[]> {
  return Sale.findAll({
    where: { saleDate: date },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'unit'] },
    ],
    order: [['createdAt', 'DESC']],
  });
}

export async function getSalesByMonth(month: string): Promise<{
  sales: Sale[];
  totalRevenueCents: number;
  totalCount: number;
}> {
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const endDate = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

  const sales = await Sale.findAll({
    where: {
      saleDate: { [Op.gte]: startDate, [Op.lt]: endDate },
    },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'unit'] },
    ],
    order: [['saleDate', 'DESC'], ['createdAt', 'DESC']],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  return { sales, totalRevenueCents, totalCount: sales.length };
}

export async function deleteSale(id: number): Promise<void> {
  const sale = await Sale.findByPk(id);
  if (!sale) throw new AppError('Sale not found', 404);

  // Restore stock (add back to the newest entry for simplicity)
  const stockEntry = await StockEntry.findOne({
    where: { productId: sale.productId },
    order: [['entryDate', 'DESC'], ['id', 'DESC']],
  });

  if (stockEntry) {
    await stockEntry.update({
      quantityRemaining: stockEntry.quantityRemaining + sale.quantity,
    });
  }

  await sale.destroy();
}

export async function getSalesByWeek(date: string): Promise<{
  sales: Sale[];
  totalRevenueCents: number;
  totalCount: number;
}> {
  const { start, end } = getPeriodRange('weekly', date);

  const sales = await Sale.findAll({
    where: {
      saleDate: { [Op.gte]: start, [Op.lt]: end },
    },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'unit'] },
    ],
    order: [['saleDate', 'DESC'], ['createdAt', 'DESC']],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  return { sales, totalRevenueCents, totalCount: sales.length };
}

export async function getSalesAnalytics(
  period: TimePeriod,
  reference: string,
  customRange?: { start: string; end: string },
): Promise<SalesAnalytics> {
  const range = getPeriodRange(period, reference, customRange);
  const prevRange = getPreviousPeriodRange(period, reference, customRange);

  // Fetch current period sales
  const sales = await Sale.findAll({
    where: { saleDate: { [Op.gte]: range.start, [Op.lt]: range.end } },
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
    order: [['saleDate', 'ASC']],
  });

  // Fetch previous period sales for comparison
  const prevSales = await Sale.findAll({
    where: { saleDate: { [Op.gte]: prevRange.start, [Op.lt]: prevRange.end } },
  });

  const previousPeriodRevenueCents = prevSales.reduce((sum, s) => sum + s.totalCents, 0);
  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalSalesCount = sales.length;

  // Trend data: revenue and count per day
  const days = enumerateDays(range);
  const dailyMap: Record<string, { revenueCents: number; count: number }> = {};
  for (const day of days) {
    dailyMap[day] = { revenueCents: 0, count: 0 };
  }
  for (const sale of sales) {
    const day = sale.saleDate;
    if (dailyMap[day]) {
      dailyMap[day].revenueCents += sale.totalCents;
      dailyMap[day].count += 1;
    }
  }

  const trendData: SalesTrendPoint[] = days.map((day) => {
    const d = new Date(day + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, revenueCents: dailyMap[day].revenueCents, count: dailyMap[day].count };
  });

  // Top products
  const productMap: Record<string, TopProductRanking> = {};
  for (const sale of sales) {
    const product = (sale as Sale & { product: Product }).product;
    const name = product?.name ?? `Product #${sale.productId}`;
    if (!productMap[name]) {
      productMap[name] = { productName: name, totalRevenueCents: 0, totalQuantity: 0 };
    }
    productMap[name].totalRevenueCents += sale.totalCents;
    productMap[name].totalQuantity += sale.quantity;
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);

  // Product breakdown for pie chart
  const productBreakdown: ProductBreakdown[] = topProducts.map((p) => ({
    productName: p.productName,
    revenueCents: p.totalRevenueCents,
    percentage: totalRevenueCents > 0
      ? Math.round((p.totalRevenueCents / totalRevenueCents) * 100)
      : 0,
  }));

  // Averages
  const avgOrderValueCents = totalSalesCount > 0 ? Math.round(totalRevenueCents / totalSalesCount) : 0;
  const avgUnitsPerSale = totalSalesCount > 0 ? Math.round((totalQuantity / totalSalesCount) * 10) / 10 : 0;

  // Revenue change %
  const revenueChangePct = previousPeriodRevenueCents === 0
    ? (totalRevenueCents > 0 ? 100 : 0)
    : Math.round(((totalRevenueCents - previousPeriodRevenueCents) / Math.abs(previousPeriodRevenueCents)) * 100);

  // Period label
  let periodLabel = reference;
  if (period === 'weekly') {
    const startD = new Date(range.start + 'T00:00:00');
    const endD = new Date(range.end + 'T00:00:00');
    endD.setDate(endD.getDate() - 1); // Sunday
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    periodLabel = `${fmt(startD)} – ${fmt(endD)}`;
  } else if (period === 'monthly') {
    const d = new Date(range.start + 'T00:00:00');
    periodLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (period === 'custom' && customRange) {
    const startD = new Date(customRange.start + 'T00:00:00');
    const endD = new Date(customRange.end + 'T00:00:00');
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    periodLabel = `${fmt(startD)} – ${fmt(endD)}, ${endD.getFullYear()}`;
  } else {
    const d = new Date(reference + 'T00:00:00');
    periodLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return {
    periodLabel,
    trendData,
    topProducts,
    totalRevenueCents,
    totalSalesCount,
    avgOrderValueCents,
    avgUnitsPerSale,
    productBreakdown,
    previousPeriodRevenueCents,
    revenueChangePct,
  };
}

export async function getSalesByRange(
  startDate: string,
  endDate: string,
): Promise<{ sales: Sale[]; totalRevenueCents: number; totalCount: number }> {
  const endExclusive = new Date(endDate + 'T00:00:00');
  endExclusive.setDate(endExclusive.getDate() + 1);
  const endExclusiveStr = endExclusive.toISOString().split('T')[0];

  const sales = await Sale.findAll({
    where: {
      saleDate: { [Op.gte]: startDate, [Op.lt]: endExclusiveStr },
    },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'unit'] },
    ],
    order: [['saleDate', 'DESC'], ['createdAt', 'DESC']],
  });

  const totalRevenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  return { sales, totalRevenueCents, totalCount: sales.length };
}
