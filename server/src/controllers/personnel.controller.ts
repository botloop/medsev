/**
 * Personnel Controller
 * Handle HTTP requests for personnel management
 */

import { Request, Response } from 'express';
import * as personnelService from '../services/personnel.service.js';
import type { CreateClinicalRecordDTO } from '../../../shared/types/personnel.types.js';
import {
  createPersonnelSchema,
  updatePersonnelSchema,
  personnelFilterSchema,
  updateMedicalStatusSchema
} from '../../../shared/validators/personnel.schemas.js';
import { createActivityLog } from '../services/activityLog.service.js';
import { moveToRecycleBin } from '../services/recycleBin.service.js';

/**
 * GET /api/personnel
 * Get all personnel with filtering and pagination
 */
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const filters = personnelFilterSchema.parse({
      search: req.query.search,
      rank: req.query.rank,
      unit: req.query.unit,
      medicalCleared: req.query.medicalCleared !== undefined ? req.query.medicalCleared === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    });

    const result = await personnelService.getAllPersonnel(filters);
    res.json(result);
  } catch (error) {
    console.error('Get all personnel error:', error);
    res.status(500).json({ error: 'Failed to fetch personnel' });
  }
};

/**
 * GET /api/personnel/:id
 * Get single personnel by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const personnel = await personnelService.getPersonnelById(id);

    if (!personnel) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    res.json(personnel);
  } catch (error) {
    console.error('Get personnel error:', error);
    res.status(500).json({ error: 'Failed to fetch personnel' });
  }
};

/**
 * POST /api/personnel
 * Create new personnel
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createPersonnelSchema.parse(req.body);

    // Create personnel
    const personnel = await personnelService.createPersonnel(
      validatedData,
      req.user!.uid
    );

    // Log activity
    await createActivityLog({
      userId: req.user!.uid,
      userName: req.user!.displayName || 'Unknown',
      userEmail: req.user!.email || '',
      action: 'create',
      resource: 'personnel',
      resourceId: personnel.id,
      description: `Created personnel record for ${personnel.firstName} ${personnel.lastName} (${personnel.serialNumber})`,
      metadata: { serialNumber: personnel.serialNumber }
    });

    res.status(201).json(personnel);
  } catch (error: any) {
    console.error('Create personnel error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    if (error.message === 'Serial number already exists') {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to create personnel' });
  }
};

/**
 * PUT /api/personnel/:id
 * Update personnel
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = updatePersonnelSchema.parse(req.body);

    // Update personnel
    const personnel = await personnelService.updatePersonnel(
      id,
      validatedData,
      req.user!.uid
    );

    if (!personnel) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    // Log activity
    await createActivityLog({
      userId: req.user!.uid,
      userName: req.user!.displayName || 'Unknown',
      userEmail: req.user!.email || '',
      action: 'update',
      resource: 'personnel',
      resourceId: personnel.id,
      description: `Updated personnel record for ${personnel.firstName} ${personnel.lastName} (${personnel.serialNumber})`,
      metadata: { serialNumber: personnel.serialNumber }
    });

    res.json(personnel);
  } catch (error: any) {
    console.error('Update personnel error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    if (error.message === 'Serial number already exists') {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to update personnel' });
  }
};

/**
 * DELETE /api/personnel/:id
 * Delete personnel
 */
export const deletePersonnel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get personnel info before deletion
    const personnel = await personnelService.getPersonnelById(id);
    if (!personnel) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    // Move to recycle bin (soft-delete)
    const actorName = req.user!.displayName || req.user!.email || 'Unknown';
    await moveToRecycleBin(
      'personnel',
      id,
      `${personnel.firstName} ${personnel.lastName} (${personnel.serialNumber})`,
      personnel as unknown as Record<string, unknown>,
      actorName
    );

    // Hard-delete from personnel collection
    await personnelService.deletePersonnel(id);

    await createActivityLog({
      userId: req.user!.uid,
      userName: actorName,
      userEmail: req.user!.email || '',
      action: 'delete',
      resource: 'personnel',
      resourceId: id,
      description: `Moved ${personnel.firstName} ${personnel.lastName} (${personnel.serialNumber}) to recycle bin`,
      metadata: { serialNumber: personnel.serialNumber }
    });

    res.json({ message: 'Personnel moved to recycle bin' });
  } catch (error) {
    console.error('Delete personnel error:', error);
    res.status(500).json({ error: 'Failed to delete personnel' });
  }
};

/**
 * PUT /api/personnel/:id/medical
 * Update medical status step
 */
export const updateMedical = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const { step, completed, notes } = updateMedicalStatusSchema.parse(req.body);

    const personnel = await personnelService.updateMedicalStatus(
      id,
      step,
      completed,
      notes,
      req.user!.uid
    );

    if (!personnel) {
      res.status(404).json({ error: 'Personnel not found' });
      return;
    }

    res.json(personnel);
  } catch (error: any) {
    console.error('Update medical status error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    res.status(500).json({ error: 'Failed to update medical status' });
  }
};

/**
 * GET /api/personnel/:id/clinical
 * Get all clinical records for a personnel
 */
export const getClinicalRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const records = await personnelService.getClinicalRecords(id);
    res.json(records);
  } catch (error) {
    console.error('Get clinical records error:', error);
    res.status(500).json({ error: 'Failed to fetch clinical records' });
  }
};

/**
 * POST /api/personnel/:id/clinical
 * Create a clinical record
 */
export const createClinicalRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body as CreateClinicalRecordDTO;

    if (!data.date || !data.complaint || !data.diagnosis || !data.treatment || !data.physician) {
      res.status(400).json({ error: 'date, complaint, diagnosis, treatment, and physician are required' });
      return;
    }

    const record = await personnelService.createClinicalRecord(id, data, req.user!.uid);

    await createActivityLog({
      userId: req.user!.uid,
      userName: req.user!.displayName || 'Unknown',
      userEmail: req.user!.email || '',
      action: 'create',
      resource: 'clinicalRecord',
      resourceId: record.id,
      description: `Added clinical record for personnel ${id}`,
      metadata: { personnelId: id }
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Create clinical record error:', error);
    res.status(500).json({ error: 'Failed to create clinical record' });
  }
};

/**
 * PUT /api/personnel/:id/clinical/:recordId
 * Update a clinical record
 */
export const updateClinicalRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, recordId } = req.params;
    const data = req.body as Partial<CreateClinicalRecordDTO>;

    const record = await personnelService.updateClinicalRecord(id, recordId, data, req.user!.uid);

    if (!record) {
      res.status(404).json({ error: 'Clinical record not found' });
      return;
    }

    await createActivityLog({
      userId: req.user!.uid,
      userName: req.user!.displayName || 'Unknown',
      userEmail: req.user!.email || '',
      action: 'update',
      resource: 'clinicalRecord',
      resourceId: recordId,
      description: `Updated clinical record ${recordId} for personnel ${id}`,
      metadata: { personnelId: id }
    });

    res.json(record);
  } catch (error) {
    console.error('Update clinical record error:', error);
    res.status(500).json({ error: 'Failed to update clinical record' });
  }
};

/**
 * DELETE /api/personnel/:id/clinical/:recordId
 * Delete a clinical record
 */
export const deleteClinicalRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, recordId } = req.params;

    const deleted = await personnelService.deleteClinicalRecord(id, recordId);

    if (!deleted) {
      res.status(404).json({ error: 'Clinical record not found' });
      return;
    }

    await createActivityLog({
      userId: req.user!.uid,
      userName: req.user!.displayName || 'Unknown',
      userEmail: req.user!.email || '',
      action: 'delete',
      resource: 'clinicalRecord',
      resourceId: recordId,
      description: `Deleted clinical record ${recordId} for personnel ${id}`,
      metadata: { personnelId: id }
    });

    res.json({ message: 'Clinical record deleted successfully' });
  } catch (error) {
    console.error('Delete clinical record error:', error);
    res.status(500).json({ error: 'Failed to delete clinical record' });
  }
};

/**
 * GET /api/personnel/stats
 * Get personnel statistics
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await personnelService.getPersonnelStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
