/**
 * Medical Supplies Routes
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../../shared/constants/permissions.js';
import * as controller from '../controllers/medicalSupplies.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id/dispense', controller.getDispenseHistory);
router.get('/:id', controller.getById);
router.post('/', requirePermission(PERMISSIONS.MEDICAL_UPDATE), controller.create);
router.post('/:id/dispense', requirePermission(PERMISSIONS.MEDICAL_UPDATE), controller.dispense);
router.put('/:id', requirePermission(PERMISSIONS.MEDICAL_UPDATE), controller.update);
router.delete('/:id', requirePermission(PERMISSIONS.PERSONNEL_DELETE), controller.remove);

export default router;
