import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getByPersonnel, getMine, create, update } from '../controllers/reEnlistment.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/mine',                 getMine);
router.post('/',                    create);
router.get('/:personnelId/records', getByPersonnel);
router.patch('/:id',                update);

export default router;
