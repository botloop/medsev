/**
 * Recycle Bin Routes
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../../shared/constants/permissions.js';
import * as controller from '../controllers/recycleBin.controller.js';

const router = Router();
router.use(authMiddleware);

// All recycle bin operations require PERSONNEL_DELETE (admin only)
router.get('/',          requirePermission(PERMISSIONS.PERSONNEL_DELETE), controller.getAll);
router.patch('/:id/restore', requirePermission(PERMISSIONS.PERSONNEL_DELETE), controller.restore);
router.delete('/:id',    requirePermission(PERMISSIONS.PERSONNEL_DELETE), controller.remove);
router.delete('/',       requirePermission(PERMISSIONS.PERSONNEL_DELETE), controller.empty);

export default router;
