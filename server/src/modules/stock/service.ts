import { Op, fn, col } from 'sequelize';
import { StockEntry, Product } from '../../models';
import { AppError } from '../../utils/AppError';
import type { StockLevel } from '@coco/shared';

export async function addStockEntry(data: {
  productId: number;
  quantityAdded: number;
  supplierNote?: string;
  entryDate: string;
  recordedBy: number;
}): Promise<StockEntry> {
  const product = await Product.findByPk(data.productId);
  if (!product) throw new AppError('Product not found', 404);

  return StockEntry.create({
    productId: data.productId,
    quantityAdded: data.quantityAdded,
    quantityRemaining: data.quantityAdded,
    supplierNote: data.supplierNote || '',
    entryDate: data.entryDate,
    recordedBy: data.recordedBy,
  });
}

export async function getStockLevels(): Promise<StockLevel[]> {
  const products = await Product.findAll({ where: { isActive: true } });

  const levels: StockLevel[] = [];

  for (const product of products) {
    const totalAdded = await StockEntry.sum('quantityAdded', {
      where: { productId: product.id },
    }) || 0;

    const totalRemaining = await StockEntry.sum('quantityRemaining', {
      where: { productId: product.id },
    }) || 0;

    levels.push({
      productId: product.id,
      productName: product.name,
      totalAdded,
      totalSold: totalAdded - totalRemaining,
      currentStock: totalRemaining,
      unit: product.unit,
    });
  }

  return levels;
}

export async function getStockHistory(productId: number): Promise<StockEntry[]> {
  return StockEntry.findAll({
    where: { productId },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'unit'] },
    ],
    order: [['entryDate', 'DESC'], ['id', 'DESC']],
  });
}
