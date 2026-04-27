import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { getAll, getById, create, update, remove } from '../controllers/pcr.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/',       requireRole('admin', 'medical', 'viewer'), getAll);
router.get('/:id',    requireRole('admin', 'medical', 'viewer'), getById);
router.post('/',      requireRole('admin', 'medical'), create);
router.put('/:id',    requireRole('admin', 'medical'), update);
router.delete('/:id', requireRole('admin', 'medical'), remove);

export default router;
