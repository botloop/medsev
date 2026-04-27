/**
 * useAssets Hook
 * Client-side state management and API calls for the Assets module
 */

import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import type { Asset, CreateAssetDTO, IssueAssetDTO, ReturnAssetDTO } from '@shared/types/assets.types';

export const useAssets = () => {
  const [assets, setAssets]   = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await api.get('/assets') as Asset[];
      setAssets(data);
    } catch {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (data: CreateAssetDTO): Promise<Asset | null> => {
    try {
      const asset = await api.post('/assets', data) as Asset;
      setAssets(prev => [...prev, asset].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      toast.success('Asset added');
      return asset;
    } catch {
      toast.error('Failed to add asset');
      return null;
    }
  };

  const updateAsset = async (id: string, data: Partial<CreateAssetDTO>): Promise<Asset | null> => {
    try {
      const asset = await api.put(`/assets/${id}`, data) as Asset;
      setAssets(prev => prev.map(a => a.id === id ? asset : a));
      toast.success('Asset updated');
      return asset;
    } catch {
      toast.error('Failed to update asset');
      return null;
    }
  };

  const issueAsset = async (id: string, data: IssueAssetDTO): Promise<Asset | null> => {
    try {
      const asset = await api.patch(`/assets/${id}/issue`, data) as Asset;
      setAssets(prev => prev.map(a => a.id === id ? asset : a));
      toast.success('Asset issued');
      return asset;
    } catch {
      toast.error('Failed to issue asset');
      return null;
    }
  };

  const returnAsset = async (id: string, data: ReturnAssetDTO): Promise<Asset | null> => {
    try {
      const asset = await api.patch(`/assets/${id}/return`, data) as Asset;
      setAssets(prev => prev.map(a => a.id === id ? asset : a));
      toast.success('Asset returned');
      return asset;
    } catch {
      toast.error('Failed to return asset');
      return null;
    }
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/assets/${id}`);
      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Asset deleted');
      return true;
    } catch {
      toast.error('Failed to delete asset');
      return false;
    }
  };

  return { assets, loading, fetchAssets, addAsset, updateAsset, issueAsset, returnAsset, deleteAsset };
};
