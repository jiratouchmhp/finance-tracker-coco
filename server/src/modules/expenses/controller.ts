import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as expenseService from './service';

const FIXED_CATEGORIES = ['LABOR', 'UTILITY'] as const;

const createSchema = z.object({
  category: z.enum(['LABOR', 'INGREDIENT', 'UTILITY', 'OTHER']),
  amountCents: z.number().int().positive(),
  description: z.string().min(1).max(255).trim(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  expenseMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM').optional(),
}).refine(
  (data) => {
    const isFixed = (FIXED_CATEGORIES as readonly string[]).includes(data.category);
    return isFixed ? !!data.expenseMonth : !!data.expenseDate;
  },
  { message: 'Fixed costs (LABOR/UTILITY) require expenseMonth; variable costs require expenseDate' },
);

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createSchema.parse(req.body);
    const expense = await expenseService.createExpense({
      ...parsed,
      recordedBy: req.user!.userId,
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
    const expenses = await expenseService.getExpensesByDate(date);
    res.json({ success: true, data: expenses });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getFixedByMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
    const expenses = await expenseService.getFixedExpensesByMonth(month);
    res.json({ success: true, data: expenses });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getMonthlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
    const summary = await expenseService.getExpenseSummaryByMonth(month);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expenseService.deleteExpense(Number(req.params.id));
    res.json({ success: true, data: null });
  } catch (error: unknown) {
    next(error);
  }
}
