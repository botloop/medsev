/**
 * Analytics Controller
 * Handle HTTP requests for analytics and statistics
 */

import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service.js';

/**
 * GET /api/analytics/overview
 * Get dashboard overview statistics
 */
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await analyticsService.getOverviewStats();
    res.json(stats);
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview statistics' });
  }
};

/**
 * GET /api/analytics/officers-enlisted
 * Get officers vs enlisted distribution
 */
export const getOfficersEnlisted = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getOfficersEnlistedData();
    res.json(data);
  } catch (error) {
    console.error('Get officers/enlisted error:', error);
    res.status(500).json({ error: 'Failed to fetch officers/enlisted data' });
  }
};

/**
 * GET /api/analytics/join-year
 * Get personnel by join year
 */
export const getJoinYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getJoinYearData();
    res.json(data);
  } catch (error) {
    console.error('Get join year error:', error);
    res.status(500).json({ error: 'Failed to fetch join year data' });
  }
};

/**
 * GET /api/analytics/medical-status
 * Get medical status distribution
 */
export const getMedicalStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getMedicalStatusData();
    res.json(data);
  } catch (error) {
    console.error('Get medical status error:', error);
    res.status(500).json({ error: 'Failed to fetch medical status data' });
  }
};

/**
 * GET /api/analytics/reenlistment
 * Get re-enlistment status distribution
 */
export const getReenlistment = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getReenlistmentData();
    res.json(data);
  } catch (error) {
    console.error('Get reenlistment error:', error);
    res.status(500).json({ error: 'Failed to fetch reenlistment data' });
  }
};

/**
 * GET /api/analytics/reenlistment-by-month
 * Get re-enlistment completion count by month for the current year
 */
export const getReenlistmentByMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getReenlistmentByMonthData();
    res.json(data);
  } catch (error) {
    console.error('Get reenlistment-by-month error:', error);
    res.status(500).json({ error: 'Failed to fetch reenlistment by month data' });
  }
};

/**
 * GET /api/analytics/all
 * Get all analytics data in one call (optimized)
 */
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await analyticsService.getAllAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Get all analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};
