/**
 * useRecycleBin Hook
 */

import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export type RecycleBinItemType = 'personnel' | 'asset' | 'medical-supply';

export interface RecycleBinItem {
  id: string;
  type: RecycleBinItemType;
  originalId: string;
  name: string;
  data: Record<string, unknown>;
  deletedAt: string;
  deletedBy: string;
}

export const useRecycleBin = () => {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async (type?: RecycleBinItemType) => {
    setLoading(true);
    try {
      const params = type ? `?type=${type}` : '';
      const data = await api.get(`/recycle-bin${params}`) as RecycleBinItem[];
      setItems(data);
    } catch {
      toast.error('Failed to load recycle bin');
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (id: string): Promise<boolean> => {
    try {
      await api.patch(`/recycle-bin/${id}/restore`, {});
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item restored successfully');
      return true;
    } catch {
      toast.error('Failed to restore item');
      return false;
    }
  };

  const permanentDelete = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/recycle-bin/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Permanently deleted');
      return true;
    } catch {
      toast.error('Failed to delete item');
      return false;
    }
  };

  const emptyBin = async (type?: RecycleBinItemType): Promise<boolean> => {
    try {
      const params = type ? `?type=${type}` : '';
      await api.delete(`/recycle-bin${params}`);
      setItems(prev => type ? prev.filter(i => i.type !== type) : []);
      toast.success('Recycle bin emptied');
      return true;
    } catch {
      toast.error('Failed to empty recycle bin');
      return false;
    }
  };

  return { items, loading, fetchItems, restoreItem, permanentDelete, emptyBin };
};
