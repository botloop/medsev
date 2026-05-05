/**
 * useMedicalSupplies Hook
 */

import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import type { MedicalSupply, CreateMedicalSupplyDTO, DispenseRecord, CreateDispenseRecordDTO } from '@shared/types/medicalSupplies.types';

export const useMedicalSupplies = () => {
  const [supplies, setSupplies] = useState<MedicalSupply[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSupplies = async () => {
    setLoading(true);
    try {
      const data = await api.get('/medical-supplies') as MedicalSupply[];
      setSupplies(data);
    } catch {
      toast.error('Failed to load medical supplies');
    } finally {
      setLoading(false);
    }
  };

  const addSupply = async (data: CreateMedicalSupplyDTO): Promise<MedicalSupply | null> => {
    try {
      const supply = await api.post('/medical-supplies', data) as MedicalSupply;
      setSupplies(prev => [...prev, supply].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Supply added');
      return supply;
    } catch {
      toast.error('Failed to add supply');
      return null;
    }
  };

  const updateSupply = async (id: string, data: Partial<CreateMedicalSupplyDTO>): Promise<MedicalSupply | null> => {
    try {
      const supply = await api.put(`/medical-supplies/${id}`, data) as MedicalSupply;
      setSupplies(prev => prev.map(s => s.id === id ? supply : s));
      toast.success('Supply updated');
      return supply;
    } catch {
      toast.error('Failed to update supply');
      return null;
    }
  };

  const deleteSupply = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/medical-supplies/${id}`);
      setSupplies(prev => prev.filter(s => s.id !== id));
      toast.success('Supply deleted');
      return true;
    } catch {
      toast.error('Failed to delete supply');
      return false;
    }
  };

  const dispenseSupply = async (supplyId: string, data: CreateDispenseRecordDTO): Promise<DispenseRecord | null> => {
    try {
      const record = await api.post(`/medical-supplies/${supplyId}/dispense`, data) as DispenseRecord;
      setSupplies(prev => prev.map(s =>
        s.id === supplyId ? { ...s, quantity: s.quantity - data.quantityDispensed } : s
      ));
      toast.success(`Dispensed ${data.quantityDispensed} to ${data.recipientName}`);
      return record;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to dispense supply');
      return null;
    }
  };

  const fetchDispenseHistory = async (supplyId: string): Promise<DispenseRecord[]> => {
    try {
      return await api.get(`/medical-supplies/${supplyId}/dispense`) as DispenseRecord[];
    } catch {
      toast.error('Failed to load dispense history');
      return [];
    }
  };

  return { supplies, loading, fetchSupplies, addSupply, updateSupply, deleteSupply, dispenseSupply, fetchDispenseHistory };
};
