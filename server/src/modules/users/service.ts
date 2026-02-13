import bcrypt from 'bcryptjs';
import { User } from '../../models';
import { AppError } from '../../utils/AppError';
import { APP_CONFIG } from '../../config/app';
import type { UserRole } from '@coco/shared';

export interface SafeUser {
  id: number;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert User model to SafeUser (excludes passwordHash)
 */
function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Get all users (excluding passwordHash)
 */
export async function listUsers(): Promise<SafeUser[]> {
  const users = await User.findAll({
    order: [['createdAt', 'DESC']],
  });
  return users.map(toSafeUser);
}

/**
 * Get a single user by ID (excluding passwordHash)
 */
export async function getUserById(id: number): Promise<SafeUser> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toSafeUser(user);
}

/**
 * Update user's username and/or role
 */
export async function updateUser(
  id: number,
  data: Partial<{ username: string; role: UserRole }>
): Promise<SafeUser> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if username is being changed and if it already exists
  if (data.username && data.username !== user.username) {
    const existing = await User.findOne({ where: { username: data.username } });
    if (existing) {
      throw new AppError('Username already exists', 409);
    }
  }

  await user.update(data);
  return toSafeUser(user);
}

/**
 * Change user's password
 */
export async function changePassword(id: number, newPassword: string): Promise<void> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const passwordHash = await bcrypt.hash(newPassword, APP_CONFIG.BCRYPT_SALT_ROUNDS);
  await user.update({ passwordHash });
}

/**
 * Delete a user (hard delete)
 * Note: Consider adding soft delete if needed in the future
 */
export async function deleteUser(id: number): Promise<void> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting the last OWNER
  if (user.role === 'OWNER') {
    const ownerCount = await User.count({ where: { role: 'OWNER' } });
    if (ownerCount <= 1) {
      throw new AppError('Cannot delete the last OWNER user', 400);
    }
  }

  await user.destroy();
}
