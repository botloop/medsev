import { Request, Response } from 'express';
import * as svc from '../services/inventory.service.js';

const uid = (req: Request) => (req as any).user?.uid || 'unknown';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try { res.json(await svc.getAllItems()); }
  catch { res.status(500).json({ error: 'Failed to fetch inventory' }); }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await svc.getItemById(req.params.id);
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(item);
  } catch { res.status(500).json({ error: 'Failed to fetch item' }); }
};

export const getByQrCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await svc.getItemByQrCode(decodeURIComponent(req.params.qrCode));
    if (!item) { res.status(404).json({ error: 'Item not found for this QR code' }); return; }
    res.json(item);
  } catch { res.status(500).json({ error: 'QR lookup failed' }); }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await svc.createItem(req.body, uid(req))); }
  catch { res.status(500).json({ error: 'Failed to create item' }); }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try { res.json(await svc.updateItem(req.params.id, req.body, uid(req))); }
  catch { res.status(500).json({ error: 'Failed to update item' }); }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try { await svc.deleteItem(req.params.id); res.json({ message: 'Deleted' }); }
  catch { res.status(500).json({ error: 'Failed to delete item' }); }
};

export const getExpiring = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    res.json(await svc.getExpiringItems(days));
  } catch { res.status(500).json({ error: 'Failed to fetch expiring items' }); }
};
