import { Request, Response } from 'express';
import * as svc from '../services/pcr.service.js';

const getUser = (req: Request) => ({
  uid:  (req as any).user?.uid  || 'unknown',
  name: (req as any).user?.displayName || (req as any).user?.email || 'Unknown',
});

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try { res.json(await svc.getAllPCRs()); }
  catch { res.status(500).json({ error: 'Failed to fetch PCR records' }); }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await svc.getPCRById(req.params.id);
    if (!record) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(record);
  } catch { res.status(500).json({ error: 'Failed to fetch PCR record' }); }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, name } = getUser(req);
    const record = await svc.createPCR(req.body, uid, name);
    res.status(201).json(record);
  } catch { res.status(500).json({ error: 'Failed to create PCR record' }); }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await svc.updatePCR(req.params.id, req.body);
    res.json(record);
  } catch { res.status(500).json({ error: 'Failed to update PCR record' }); }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await svc.deletePCR(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete PCR record' }); }
};
