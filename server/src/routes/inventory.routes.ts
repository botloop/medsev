import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getAll, getById, getByQrCode, create, update, remove, getExpiring } from '../controllers/inventory.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/',             getAll);
router.get('/expiring',     getExpiring);      // ?days=30
router.get('/scan/:qrCode', getByQrCode);      // QR lookup
router.get('/:id',          getById);
router.post('/',            create);
router.put('/:id',          update);
router.delete('/:id',       remove);

export default router;
