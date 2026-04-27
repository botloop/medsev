/**
 * Activity Log Routes
 * API routes for activity logs
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as activityLogController from '../controllers/activityLog.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/activity-log - Get all activity logs with filters
router.get('/', activityLogController.getAllActivityLogs);

// GET /api/activity-log/:id - Get single activity log
router.get('/:id', activityLogController.getActivityLog);

export default router;
