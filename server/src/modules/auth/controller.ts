import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from './service';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['OWNER', 'STAFF']),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await authService.loginUser(parsed.username, parsed.password);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await authService.registerUser(parsed.username, parsed.password, parsed.role);
    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    next(error);
  }
}
