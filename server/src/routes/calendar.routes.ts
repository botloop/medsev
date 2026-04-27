/**
 * Calendar of Activities Routes
 */

import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/calendar.controller.js';

const router = Router();
router.use(authMiddleware);

// All authenticated users can view
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Only admins can create, update, delete
router.post('/', requireRole('admin'), controller.create);
router.put('/:id', requireRole('admin'), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

export default router;
