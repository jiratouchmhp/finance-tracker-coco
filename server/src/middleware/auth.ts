import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../config/app';
import { AppError } from '../utils/AppError';
import type { UserRole } from '@coco/shared';

export interface AuthPayload {
  userId: number;
  username: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, APP_CONFIG.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }

    next();
  };
}
