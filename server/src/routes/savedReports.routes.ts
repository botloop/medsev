import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/savedReports.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/',      requireRole('admin', 'medical'), controller.getAll);
router.get('/:id',   requireRole('admin', 'medical'), controller.getById);
router.post('/',     requireRole('admin', 'medical'), controller.create);
router.delete('/:id',requireRole('admin', 'medical'), controller.remove);
export default router;
