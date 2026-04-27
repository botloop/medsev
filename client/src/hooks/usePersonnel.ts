/**
 * usePersonnel Hook
 * Manage personnel data and operations
 */

import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import type {
  Personnel,
  CreatePersonnelDTO,
  PersonnelFilters
} from '@shared/types/personnel.types';
import type { PaginatedResponse } from '@shared/types/common.types';

export const usePersonnel = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPersonnel = async (filters?: PersonnelFilters) => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Personnel> = await api.get('/personnel', {
        params: filters
      });

      setPersonnel(response.data);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch personnel:', error);
      toast.error('Failed to load personnel records');
    } finally {
      setLoading(false);
    }
  };

  const getPersonnelById = async (id: string): Promise<Personnel | null> => {
    try {
      const response: Personnel = await api.get(`/personnel/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch personnel:', error);
      toast.error('Failed to load personnel details');
      return null;
    }
  };

  const addPersonnel = async (data: CreatePersonnelDTO): Promise<Personnel | null> => {
    try {
      const response: Personnel = await api.post('/personnel', data);
      toast.success('Personnel created successfully!');

      // Refresh list
      await fetchPersonnel();

      return response;
    } catch (error: any) {
      console.error('Failed to create personnel:', error);

      if (error.response?.status === 409) {
        toast.error('Serial number already exists');
      } else if (error.response?.status === 400) {
        toast.error('Invalid personnel data');
      } else {
        toast.error('Failed to create personnel');
      }

      return null;
    }
  };

  const updatePersonnel = async (
    id: string,
    data: Partial<CreatePersonnelDTO>
  ): Promise<Personnel | null> => {
    try {
      const response: Personnel = await api.put(`/personnel/${id}`, data);
      toast.success('Personnel updated successfully!');

      // Update in local state
      setPersonnel((prev) => prev.map((p) => (p.id === id ? response : p)));

      return response;
    } catch (error: any) {
      console.error('Failed to update personnel:', error);

      if (error.response?.status === 409) {
        toast.error('Serial number already exists');
      } else if (error.response?.status === 400) {
        toast.error('Invalid personnel data');
      } else {
        toast.error('Failed to update personnel');
      }

      return null;
    }
  };

  const deletePersonnel = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/personnel/${id}`);
      toast.success('Personnel deleted successfully');

      // Remove from local state
      setPersonnel((prev) => prev.filter((p) => p.id !== id));

      return true;
    } catch (error) {
      console.error('Failed to delete personnel:', error);
      toast.error('Failed to delete personnel');
      return false;
    }
  };

  const updateMedicalStatus = async (
    id: string,
    step: number,
    completed: boolean,
    notes?: string
  ): Promise<Personnel | null> => {
    try {
      const response: Personnel = await api.put(`/personnel/${id}/medical`, {
        step,
        completed,
        notes
      });

      toast.success(`Medical step ${step} ${completed ? 'completed' : 'updated'}`);

      // Update in local state
      setPersonnel((prev) => prev.map((p) => (p.id === id ? response : p)));

      return response;
    } catch (error) {
      console.error('Failed to update medical status:', error);
      toast.error('Failed to update medical status');
      return null;
    }
  };

  return {
    personnel,
    loading,
    total,
    page,
    totalPages,
    fetchPersonnel,
    getPersonnelById,
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    updateMedicalStatus
  };
};
