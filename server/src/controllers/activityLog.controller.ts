/**
 * Activity Log Controller
 * Handle activity log API requests
 */

import type { Request, Response } from 'express';
import { getActivityLogs, getActivityLogById } from '../services/activityLog.service.js';
import type { ActivityLogFilters } from '@shared/types/activity.types';

/**
 * Get all activity logs with filters
 */
export const getAllActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: ActivityLogFilters = {
      userId: req.query.userId as string,
      action: req.query.action as any,
      resource: req.query.resource as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const activityLogs = await getActivityLogs(filters);

    res.json(activityLogs);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
};

/**
 * Get single activity log by ID
 */
export const getActivityLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const activityLog = await getActivityLogById(id);

    if (!activityLog) {
      res.status(404).json({ error: 'Activity log not found' });
      return;
    }

    res.json(activityLog);
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
};
