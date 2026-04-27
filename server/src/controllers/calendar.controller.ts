/**
 * Calendar Controller
 */

import { Request, Response } from 'express';
import * as service from '../services/calendar.service.js';
import { createActivityLog } from '../services/activityLog.service.js';

const getUser = (req: Request) => ({
  uid: (req as any).user?.uid || 'unknown',
  name: (req as any).user?.displayName || (req as any).user?.email || 'Unknown User',
});

export const getAll = async (req: Request, res: Response) => {
  try {
    const activities = await service.getAllActivities();
    return res.json(activities);
  } catch (error) {
    console.error('getAll calendar activities error:', error);
    return res.status(500).json({ error: 'Failed to fetch calendar activities' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const activity = await service.getActivityById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    return res.json(activity);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const activity = await service.createActivity(req.body, name);
    await createActivityLog({
      userId: uid,
      userName: name,
      action: 'create',
      resource: 'calendarActivity',
      resourceId: activity.id,
      description: `Added calendar activity: ${activity.title} on ${activity.date}`,
      metadata: { activityId: activity.id },
    });
    return res.status(201).json(activity);
  } catch (error) {
    console.error('create calendar activity error:', error);
    return res.status(500).json({ error: 'Failed to create activity' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const activity = await service.updateActivity(req.params.id, req.body, name);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    await createActivityLog({
      userId: uid,
      userName: name,
      action: 'update',
      resource: 'calendarActivity',
      resourceId: activity.id,
      description: `Updated calendar activity: ${activity.title}`,
      metadata: { activityId: activity.id },
    });
    return res.json(activity);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update activity' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const deleted = await service.deleteActivity(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Activity not found' });
    await createActivityLog({
      userId: uid,
      userName: name,
      action: 'delete',
      resource: 'calendarActivity',
      resourceId: req.params.id,
      description: `Deleted calendar activity ID: ${req.params.id}`,
      metadata: { activityId: req.params.id },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete activity' });
  }
};
