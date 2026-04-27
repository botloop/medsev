/**
 * useCalendar Hook
 */

import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import type { CalendarActivity, CreateCalendarActivityDTO } from '@shared/types/calendar.types';

export const useCalendar = () => {
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await api.get('/calendar') as CalendarActivity[];
      setActivities(data);
    } catch {
      toast.error('Failed to load calendar activities');
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (data: CreateCalendarActivityDTO): Promise<CalendarActivity | null> => {
    try {
      const activity = await api.post('/calendar', data) as CalendarActivity;
      setActivities(prev => [...prev, activity].sort((a, b) => a.date.localeCompare(b.date)));
      toast.success('Activity added');
      return activity;
    } catch {
      toast.error('Failed to add activity');
      return null;
    }
  };

  const updateActivity = async (id: string, data: Partial<CreateCalendarActivityDTO>): Promise<CalendarActivity | null> => {
    try {
      const activity = await api.put(`/calendar/${id}`, data) as CalendarActivity;
      setActivities(prev => prev.map(a => a.id === id ? activity : a));
      toast.success('Activity updated');
      return activity;
    } catch {
      toast.error('Failed to update activity');
      return null;
    }
  };

  const deleteActivity = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/calendar/${id}`);
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Activity deleted');
      return true;
    } catch {
      toast.error('Failed to delete activity');
      return false;
    }
  };

  return { activities, loading, fetchActivities, addActivity, updateActivity, deleteActivity };
};
