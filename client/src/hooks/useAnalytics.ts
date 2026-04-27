/**
 * useAnalytics Hook
 * Fetch and manage analytics data
 */

import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import type {
  AnalyticsOverview,
  OfficersEnlistedData,
  JoinYearData,
  MedicalStatusData,
  ReenlistmentData,
  ReenlistmentByMonthData
} from '@shared/types/common.types';

interface AllAnalyticsData {
  overview: AnalyticsOverview;
  officersEnlisted: OfficersEnlistedData;
  joinYear: JoinYearData[];
  medicalStatus: MedicalStatusData;
  reenlistment: ReenlistmentData;
  reenlistmentByMonth: ReenlistmentByMonthData[];
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [officersEnlisted, setOfficersEnlisted] = useState<OfficersEnlistedData | null>(null);
  const [joinYear, setJoinYear] = useState<JoinYearData[]>([]);
  const [medicalStatus, setMedicalStatus] = useState<MedicalStatusData | null>(null);
  const [reenlistment, setReenlistment] = useState<ReenlistmentData | null>(null);
  const [reenlistmentByMonth, setReenlistmentByMonth] = useState<ReenlistmentByMonthData[]>([]);

  // Fetch all analytics data in one optimized call
  const fetchAll = async () => {
    setLoading(true);
    try {
      const data: AllAnalyticsData = await api.get('/analytics/all');

      setOverview(data.overview);
      setOfficersEnlisted(data.officersEnlisted);
      setJoinYear(data.joinYear);
      setMedicalStatus(data.medicalStatus);
      setReenlistment(data.reenlistment);
      setReenlistmentByMonth(data.reenlistmentByMonth ?? []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual analytics (if needed)
  const fetchOverview = async () => {
    try {
      const data: AnalyticsOverview = await api.get('/analytics/overview');
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    }
  };

  const fetchOfficersEnlisted = async () => {
    try {
      const data: OfficersEnlistedData = await api.get('/analytics/officers-enlisted');
      setOfficersEnlisted(data);
    } catch (error) {
      console.error('Failed to fetch officers/enlisted:', error);
    }
  };

  const fetchJoinYear = async () => {
    try {
      const data: JoinYearData[] = await api.get('/analytics/join-year');
      setJoinYear(data);
    } catch (error) {
      console.error('Failed to fetch join year:', error);
    }
  };

  const fetchMedicalStatus = async () => {
    try {
      const data: MedicalStatusData = await api.get('/analytics/medical-status');
      setMedicalStatus(data);
    } catch (error) {
      console.error('Failed to fetch medical status:', error);
    }
  };

  const fetchReenlistment = async () => {
    try {
      const data: ReenlistmentData = await api.get('/analytics/reenlistment');
      setReenlistment(data);
    } catch (error) {
      console.error('Failed to fetch reenlistment:', error);
    }
  };

  return {
    loading,
    overview,
    officersEnlisted,
    joinYear,
    medicalStatus,
    reenlistment,
    reenlistmentByMonth,
    fetchAll,
    fetchOverview,
    fetchOfficersEnlisted,
    fetchJoinYear,
    fetchMedicalStatus,
    fetchReenlistment
  };
};
