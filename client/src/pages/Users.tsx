import { useState, JSX } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import type { User, UserRole } from '@coco/shared';

export default function Users(): JSX.Element {
  const { user: currentUser } = useAuth();
  const { users, loading, error, createUser, updateUser, changePassword, deleteUser } = useUsers();

  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STAFF');

  // Password change state
  const [changingPasswordId, setChangingPasswordId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  async function handleCreateUser(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await createUser(username, password, role);
      setUsername('');
      setPassword('');
      setRole('STAFF');
      setShowCreateForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(id: number): Promise<void> {
    setSubmitting(true);
    setFormError('');

    try {
      await updateUser(id, { username: editUsername, role: editRole });
      setEditingId(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword(id: number): Promise<void> {
    setSubmitting(true);
    setFormError('');

    try {
      await changePassword(id, newPassword);
      setChangingPasswordId(null);
      setNewPassword('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(id: number): Promise<void> {
    if (id === currentUser?.id) {
      setFormError("You cannot delete your own account");
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setFormError('');
    try {
      await deleteUser(id);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  function startEdit(user: User): void {
    setEditingId(user.id);
    setEditUsername(user.username);
    setEditRole(user.role);
    setChangingPasswordId(null);
  }

  function startChangePassword(id: number): void {
    setChangingPasswordId(id);
    setNewPassword('');
    setEditingId(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setChangingPasswordId(null);
    setNewPassword('');
    setFormError('');
  }

  const columns = [
    {
      key: 'username',
      header: 'Username',
      render: (item: Record<string, unknown>) => {
        const user = item as unknown as User;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.username}</span>
            {user.id === currentUser?.id && (
              <Badge variant="info">You</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: Record<string, unknown>) => {
        const user = item as unknown as User;
        return (
          <Badge variant={user.role === 'OWNER' ? 'warning' : 'neutral'}>
            {user.role}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (item: Record<string, unknown>) => {
        const user = item as unknown as User;
        return new Date(user.createdAt).toLocaleDateString();
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Record<string, unknown>) => {
        const user = item as unknown as User;

        if (editingId === user.id) {
          return (
            <div className="flex items-center gap-2">
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Username"
                className="w-32"
              />
              <Select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                options={[
                  { value: 'STAFF', label: 'Staff' },
                  { value: 'OWNER', label: 'Owner' },
                ]}
                className="w-24"
              />
              <Button
                onClick={() => handleUpdateUser(user.id)}
                disabled={submitting}
                size="sm"
              >
                Save
              </Button>
              <Button onClick={cancelEdit} variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          );
        }

        if (changingPasswordId === user.id) {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-40"
              />
              <Button
                onClick={() => handleChangePassword(user.id)}
                disabled={submitting || newPassword.length < 6}
                size="sm"
              >
                Save
              </Button>
              <Button onClick={cancelEdit} variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button onClick={() => startEdit(user)} variant="secondary" size="sm">
              Edit
            </Button>
            <Button onClick={() => startChangePassword(user.id)} variant="secondary" size="sm">
              Change Password
            </Button>
            <Button
              onClick={() => handleDeleteUser(user.id)}
              variant="danger"
              size="sm"
              disabled={user.id === currentUser?.id}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </Button>
      </div>

      {(error || formError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || formError}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                options={[
                  { value: 'STAFF', label: 'Staff' },
                  { value: 'OWNER', label: 'Owner' },
                ]}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
        <DataTable columns={columns} data={users} />
      </Card>
    </div>
  );
}
