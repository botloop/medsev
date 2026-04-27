/**
 * Assets Routes
 * Asset & Resource Accountability endpoints
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../../shared/constants/permissions.js';
import * as controller from '../controllers/assets.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/',              requirePermission(PERMISSIONS.ASSETS_READ),  controller.getAll);
router.get('/:id',           requirePermission(PERMISSIONS.ASSETS_READ),  controller.getById);
router.post('/',             requirePermission(PERMISSIONS.ASSETS_WRITE), controller.create);
router.put('/:id',           requirePermission(PERMISSIONS.ASSETS_WRITE), controller.update);
router.patch('/:id/issue',   requirePermission(PERMISSIONS.ASSETS_WRITE), controller.issue);
router.patch('/:id/return',  requirePermission(PERMISSIONS.ASSETS_WRITE), controller.returnAsset);
router.delete('/:id',        requirePermission(PERMISSIONS.ASSETS_WRITE), controller.remove);

export default router;
