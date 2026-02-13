import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as stockService from './service';

const createSchema = z.object({
  productId: z.number().int().positive(),
  quantityAdded: z.number().int().positive(),
  supplierNote: z.string().max(255).optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export async function addEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createSchema.parse(req.body);
    const entry = await stockService.addStockEntry({
      ...parsed,
      recordedBy: req.user!.userId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getLevels(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const levels = await stockService.getStockLevels();
    res.json({ success: true, data: levels });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = Number(req.params.productId);
    const history = await stockService.getStockHistory(productId);
    res.json({ success: true, data: history });
  } catch (error: unknown) {
    next(error);
  }
}
