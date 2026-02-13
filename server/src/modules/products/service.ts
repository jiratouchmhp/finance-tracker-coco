import { Product } from '../../models';
import { AppError } from '../../utils/AppError';

export async function getAllProducts(): Promise<Product[]> {
  return Product.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
}

export async function getProductById(id: number): Promise<Product> {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

export async function createProduct(data: {
  name: string;
  costPriceCents: number;
  packagingCostCents: number;
  sellingPriceCents: number;
  unit: string;
}): Promise<Product> {
  return Product.create(data);
}

export async function updateProduct(
  id: number,
  data: Partial<{ name: string; costPriceCents: number; packagingCostCents: number; sellingPriceCents: number; unit: string; isActive: boolean }>
): Promise<Product> {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError('Product not found', 404);
  await product.update(data);
  return product;
}

export async function deleteProduct(id: number): Promise<void> {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError('Product not found', 404);
  await product.update({ isActive: false });
}
