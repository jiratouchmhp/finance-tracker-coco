import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as productService from './service';

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  costPriceCents: z.number().int().min(0),
  packagingCostCents: z.number().int().min(0),
  sellingPriceCents: z.number().int().min(0),
  unit: z.string().min(1).max(20).trim(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  costPriceCents: z.number().int().min(0).optional(),
  packagingCostCents: z.number().int().min(0).optional(),
  sellingPriceCents: z.number().int().min(0).optional(),
  unit: z.string().min(1).max(20).trim().optional(),
  isActive: z.boolean().optional(),
});

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await productService.getAllProducts();
    res.json({ success: true, data: products });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.getProductById(Number(req.params.id));
    res.json({ success: true, data: product });
  } catch (error: unknown) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createSchema.parse(req.body);
    const product = await productService.createProduct(parsed);
    res.status(201).json({ success: true, data: product });
  } catch (error: unknown) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateSchema.parse(req.body);
    const product = await productService.updateProduct(Number(req.params.id), parsed);
    res.json({ success: true, data: product });
  } catch (error: unknown) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productService.deleteProduct(Number(req.params.id));
    res.json({ success: true, data: null });
  } catch (error: unknown) {
    next(error);
  }
}
