import { useState, useEffect } from 'react';
import { userApi, authApi } from '../services/api';
import type { User, UpdateUserRequest, UserRole } from '@coco/shared';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (username: string, password: string, role: UserRole): Promise<void> => {
    try {
      await authApi.register({ username, password, role });
      await load();
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateUser = async (id: number, data: UpdateUserRequest): Promise<void> => {
    try {
      await userApi.update(id, data);
      await load();
    } catch (err: unknown) {
      throw err;
    }
  };

  const changePassword = async (id: number, newPassword: string): Promise<void> => {
    try {
      await userApi.changePassword(id, { newPassword });
      await load();
    } catch (err: unknown) {
      throw err;
    }
  };

  const deleteUser = async (id: number): Promise<void> => {
    try {
      await userApi.delete(id);
      await load();
    } catch (err: unknown) {
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    changePassword,
    deleteUser,
    reload: load,
  };
}
