import { Request, Response } from 'express';
import * as service from '../services/reEnlistment.service.js';

export const getByPersonnel = async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await service.getRecordsByPersonnelId(req.params.personnelId);
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

export const getMine = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;
    const record = await service.getRecordByUserId(userId);
    res.json(record ?? null);
  } catch {
    res.status(500).json({ error: 'Failed to fetch record' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;
    const { personnelId, eteDate } = req.body;
    if (!personnelId || !eteDate) { res.status(400).json({ error: 'personnelId and eteDate required' }); return; }
    const record = await service.createRecord({ personnelId, userId, eteDate });
    res.status(201).json(record);
  } catch {
    res.status(500).json({ error: 'Failed to create record' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await service.updateRecord(req.params.id, req.body);
    res.json(record);
  } catch {
    res.status(500).json({ error: 'Failed to update record' });
  }
};
