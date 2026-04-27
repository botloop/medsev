/**
 * Users Routes
 * User management endpoints (admin only)
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../../shared/constants/permissions.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/',              requirePermission(PERMISSIONS.USER_READ),   controller.getAll);
router.patch('/:uid/role',   requirePermission(PERMISSIONS.USER_UPDATE), controller.updateRole);
router.delete('/:uid',       requirePermission(PERMISSIONS.USER_DELETE), controller.remove);

export default router;
