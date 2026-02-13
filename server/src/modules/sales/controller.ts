import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as salesService from './service';
import type { TimePeriod } from '@coco/shared';

const createSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().min(0),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createSchema.parse(req.body);
    const sale = await salesService.createSale({
      ...parsed,
      recordedBy: req.user!.userId,
    });
    res.status(201).json({ success: true, data: sale });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
    const sales = await salesService.getSalesByDate(date);
    res.json({ success: true, data: sales });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getByMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
    const summary = await salesService.getSalesByMonth(month);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await salesService.deleteSale(Number(req.params.id));
    res.json({ success: true, data: null });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getByWeek(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
    const summary = await salesService.getSalesByWeek(date);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = z.enum(['daily', 'weekly', 'monthly', 'custom']).parse(req.query.period) as TimePeriod;

    if (period === 'custom') {
      const start = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.start);
      const end = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.end);
      if (end < start) {
        res.status(400).json({ success: false, error: 'end date must be on or after start date' });
        return;
      }
      const analytics = await salesService.getSalesAnalytics(period, start, { start, end });
      res.json({ success: true, data: analytics });
    } else {
      const ref = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.ref);
      const analytics = await salesService.getSalesAnalytics(period, ref);
      res.json({ success: true, data: analytics });
    }
  } catch (error: unknown) {
    next(error);
  }
}

export async function getByRange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const start = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.start);
    const end = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.end);
    if (end < start) {
      res.status(400).json({ success: false, error: 'end date must be on or after start date' });
      return;
    }
    const summary = await salesService.getSalesByRange(start, end);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}
