import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as dashboardService from './service';

export async function getWeekly(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
    const summary = await dashboardService.getWeeklySummary(date);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getDaily(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
    const summary = await dashboardService.getDailySummary(date);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
    const summary = await dashboardService.getMonthlySummary(month);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
    const report = await dashboardService.getMonthlyReport(month);
    res.json({ success: true, data: report });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getCustomRange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const start = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD').parse(req.query.start);
    const end = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD').parse(req.query.end);
    if (end < start) {
      res.status(400).json({ success: false, error: 'end date must be on or after start date' });
      return;
    }
    const summary = await dashboardService.getCustomRangeSummary(start, end);
    res.json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
}
