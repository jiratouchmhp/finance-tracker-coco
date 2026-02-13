import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models';
import { APP_CONFIG } from '../../config/app';
import { AppError } from '../../utils/AppError';
import type { UserRole } from '@coco/shared';

export async function registerUser(
  username: string,
  password: string,
  role: UserRole
): Promise<{ token: string; user: { id: number; username: string; role: UserRole } }> {
  const existing = await User.findOne({ where: { username } });
  if (existing) {
    throw new AppError('Username already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, APP_CONFIG.BCRYPT_SALT_ROUNDS);
  const user = await User.create({ username, passwordHash, role });

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    APP_CONFIG.JWT_SECRET,
    { expiresIn: APP_CONFIG.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ token: string; user: { id: number; username: string; role: UserRole } }> {
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new AppError('Invalid username or password', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid username or password', 401);
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    APP_CONFIG.JWT_SECRET,
    { expiresIn: APP_CONFIG.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}
