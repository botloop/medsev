/**
 * Analytics Routes
 * Define API endpoints for analytics and statistics
 */

import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../../shared/constants/permissions.js';

const router = Router();

// All routes require authentication and analytics permission
router.use(authMiddleware);
router.use(requirePermission(PERMISSIONS.ANALYTICS_READ));

/**
 * GET /api/analytics/all
 * Get all analytics data (optimized single call)
 */
router.get('/all', analyticsController.getAll);

/**
 * GET /api/analytics/overview
 * Get dashboard overview statistics
 */
router.get('/overview', analyticsController.getOverview);

/**
 * GET /api/analytics/officers-enlisted
 * Get officers vs enlisted distribution
 */
router.get('/officers-enlisted', analyticsController.getOfficersEnlisted);

/**
 * GET /api/analytics/join-year
 * Get personnel by join year
 */
router.get('/join-year', analyticsController.getJoinYear);

/**
 * GET /api/analytics/medical-status
 * Get medical status distribution
 */
router.get('/medical-status', analyticsController.getMedicalStatus);

/**
 * GET /api/analytics/reenlistment
 * Get re-enlistment status distribution
 */
router.get('/reenlistment', analyticsController.getReenlistment);

/**
 * GET /api/analytics/reenlistment-by-month
 * Get re-enlistment completion count by month for the current year
 */
router.get('/reenlistment-by-month', analyticsController.getReenlistmentByMonth);

export default router;
