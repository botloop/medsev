/**
 * useActivityLog Hook
 * Fetch and manage activity log data
 */

import { useState, useEffect } from 'react';
import type { ActivityLog, ActivityLogFilters } from '@shared/types/activity.types';
import api from '../services/api';

export const useActivityLog = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = async (filters?: ActivityLogFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/activity-log', { params: filters });
      setActivityLogs(response.data || response);
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      setError(err.response?.data?.error || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  return {
    activityLogs,
    loading,
    error,
    fetchActivityLogs,
    refetch: fetchActivityLogs
  };
};
