import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as fraudService from './service';

export async function getAlerts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alerts = await fraudService.detectFraudAlerts();
    res.json({ success: true, data: alerts });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const days = req.query.days ? z.coerce.number().int().min(1).max(365).parse(req.query.days) : 30;
    const dashboard = await fraudService.getFraudDashboard(days);
    res.json({ success: true, data: dashboard });
  } catch (error: unknown) {
    next(error);
  }
}
