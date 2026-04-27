/**
 * Routes Index
 * Aggregate all API routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import personnelRoutes from './personnel.routes.js';
import analyticsRoutes from './analytics.routes.js';
import uploadRoutes from './upload.routes.js';
import activityLogRoutes from './activityLog.routes.js';
import chatRoutes from './chat.routes.js';
import notificationsRoutes from './notifications.routes.js';
import medicalSuppliesRoutes from './medicalSupplies.routes.js';
import calendarRoutes from './calendar.routes.js';
import assetsRoutes from './assets.routes.js';
import usersRoutes from './users.routes.js';
import recycleBinRoutes from './recycleBin.routes.js';
import savedReportsRoutes from './savedReports.routes.js';
import personnelRequestsRoutes from './personnelRequests.routes.js';
import scannerRoutes from './scanner.routes.js';
import reEnlistmentRoutes from './reEnlistment.routes.js';
import pcrRoutes from './pcr.routes.js';
import inventoryRoutes from './inventory.routes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/personnel', personnelRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);
router.use('/activity-log', activityLogRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/medical-supplies', medicalSuppliesRoutes);
router.use('/calendar', calendarRoutes);
router.use('/assets', assetsRoutes);
router.use('/users', usersRoutes);
router.use('/recycle-bin', recycleBinRoutes);
router.use('/saved-reports', savedReportsRoutes);
router.use('/personnel-requests', personnelRequestsRoutes);
router.use('/scan', scannerRoutes);
router.use('/re-enlistment', reEnlistmentRoutes);
router.use('/pcr', pcrRoutes);
router.use('/inventory', inventoryRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PCG Personnel Management API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
