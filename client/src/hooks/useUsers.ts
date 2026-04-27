/**
 * useUsers Hook
 * Client-side state management and API calls for the Users module
 */

import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import type { User, UserRole } from '@shared/types/auth.types';

export const useUsers = () => {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users') as User[];
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (uid: string, role: UserRole): Promise<User | null> => {
    try {
      const user = await api.patch(`/users/${uid}/role`, { role }) as User;
      setUsers(prev => prev.map(u => u.uid === uid ? user : u));
      toast.success(`Role updated to "${role}"`);
      return user;
    } catch {
      toast.error('Failed to update role');
      return null;
    }
  };

  const deleteUser = async (uid: string): Promise<boolean> => {
    try {
      await api.delete(`/users/${uid}`);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast.success('User deleted');
      return true;
    } catch {
      toast.error('Failed to delete user');
      return false;
    }
  };

  return { users, loading, fetchUsers, updateRole, deleteUser };
};
