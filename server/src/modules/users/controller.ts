import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from './service';

const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).trim().optional(),
  role: z.enum(['OWNER', 'STAFF']).optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * GET /api/users - List all users
 */
export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: users });
  } catch (error: unknown) {
    next(error);
  }
}

/**
 * GET /api/users/:id - Get single user by ID
 */
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(Number(req.params.id));
    res.json({ success: true, data: user });
  } catch (error: unknown) {
    next(error);
  }
}

/**
 * PUT /api/users/:id - Update user (username and/or role)
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(Number(req.params.id), parsed);
    res.json({ success: true, data: user });
  } catch (error: unknown) {
    next(error);
  }
}

/**
 * PUT /api/users/:id/password - Change user password
 */
export async function updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = changePasswordSchema.parse(req.body);
    await userService.changePassword(Number(req.params.id), parsed.newPassword);
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error: unknown) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id - Delete user
 */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUser(Number(req.params.id));
    res.json({ success: true, data: { message: 'User deleted successfully' } });
  } catch (error: unknown) {
    next(error);
  }
}
