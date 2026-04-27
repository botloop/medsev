/**
 * Personnel Routes
 * Define API endpoints for personnel management
 */

import { Router } from 'express';
import * as personnelController from '../controllers/personnel.controller.js';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../../shared/constants/permissions.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/personnel/stats
 * Get personnel statistics
 */
router.get('/stats', requirePermission(PERMISSIONS.ANALYTICS_READ), personnelController.getStats);

/**
 * GET /api/personnel
 * Get all personnel with filtering and pagination
 */
router.get('/', requirePermission(PERMISSIONS.PERSONNEL_READ), personnelController.getAll);

/**
 * GET /api/personnel/:id
 * Get single personnel by ID
 */
router.get('/:id', requirePermission(PERMISSIONS.PERSONNEL_READ), personnelController.getById);

/**
 * POST /api/personnel
 * Create new personnel
 */
router.post('/', requirePermission(PERMISSIONS.PERSONNEL_CREATE), personnelController.create);

/**
 * PUT /api/personnel/:id
 * Update personnel
 */
router.put(
  '/:id',
  requirePermission(PERMISSIONS.PERSONNEL_UPDATE),
  personnelController.update
);

/**
 * DELETE /api/personnel/:id
 * Delete personnel
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PERSONNEL_DELETE),
  personnelController.deletePersonnel
);

/**
 * PUT /api/personnel/:id/medical
 * Update medical status step
 */
router.put(
  '/:id/medical',
  requirePermission(PERMISSIONS.MEDICAL_UPDATE),
  personnelController.updateMedical
);

/**
 * GET /api/personnel/:id/clinical
 * Get clinical records for a personnel
 */
router.get('/:id/clinical', requirePermission(PERMISSIONS.PERSONNEL_READ), personnelController.getClinicalRecords);

/**
 * POST /api/personnel/:id/clinical
 * Create a clinical record
 */
router.post('/:id/clinical', requirePermission(PERMISSIONS.MEDICAL_UPDATE), personnelController.createClinicalRecord);

/**
 * PUT /api/personnel/:id/clinical/:recordId
 * Update a clinical record
 */
router.put('/:id/clinical/:recordId', requirePermission(PERMISSIONS.MEDICAL_UPDATE), personnelController.updateClinicalRecord);

/**
 * DELETE /api/personnel/:id/clinical/:recordId
 * Delete a clinical record
 */
router.delete('/:id/clinical/:recordId', requirePermission(PERMISSIONS.PERSONNEL_DELETE), personnelController.deleteClinicalRecord);

export default router;
