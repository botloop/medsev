/**
 * Recycle Bin Controller
 */

import { Request, Response } from 'express';
import * as service from '../services/recycleBin.service.js';
import { createActivityLog } from '../services/activityLog.service.js';
import type { RecycleBinItemType } from '../services/recycleBin.service.js';

const getActor = (req: Request) => ({
  uid:  (req as any).user?.uid  || 'unknown',
  name: (req as any).user?.displayName || (req as any).user?.email || 'Unknown',
  email: (req as any).user?.email || '',
});

export const getAll = async (req: Request, res: Response) => {
  try {
    const type = req.query.type as RecycleBinItemType | undefined;
    const items = await service.getAllRecycleBin(type);
    return res.json(items);
  } catch (error) {
    console.error('recycleBin getAll error:', error);
    return res.status(500).json({ error: 'Failed to fetch recycle bin' });
  }
};

export const restore = async (req: Request, res: Response) => {
  try {
    const { uid, name, email } = getActor(req);
    const item = await service.restoreItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found in recycle bin' });

    await createActivityLog({
      userId: uid,
      userName: name,
      userEmail: email,
      action: 'create',
      resource: item.type === 'personnel' ? 'personnel' : item.type === 'asset' ? 'asset' : 'personnel',
      resourceId: item.originalId,
      description: `Restored "${item.name}" (${item.type}) from recycle bin`,
      metadata: { originalId: item.originalId, type: item.type },
    });

    return res.json(item);
  } catch (error) {
    console.error('recycleBin restore error:', error);
    return res.status(500).json({ error: 'Failed to restore item' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { uid, name, email } = getActor(req);
    const deleted = await service.permanentDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found in recycle bin' });

    await createActivityLog({
      userId: uid,
      userName: name,
      userEmail: email,
      action: 'delete',
      resource: 'personnel',
      resourceId: req.params.id,
      description: `Permanently deleted recycle bin item ID: ${req.params.id}`,
      metadata: { recycleBinId: req.params.id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('recycleBin remove error:', error);
    return res.status(500).json({ error: 'Failed to permanently delete item' });
  }
};

export const empty = async (req: Request, res: Response) => {
  try {
    const { uid, name, email } = getActor(req);
    const type = req.query.type as RecycleBinItemType | undefined;
    const count = await service.emptyRecycleBin(type);

    await createActivityLog({
      userId: uid,
      userName: name,
      userEmail: email,
      action: 'delete',
      resource: 'personnel',
      resourceId: 'recycle_bin',
      description: `Emptied recycle bin${type ? ` (${type})` : ''} — ${count} item(s) permanently deleted`,
      metadata: { count, type },
    });

    return res.json({ success: true, count });
  } catch (error) {
    console.error('recycleBin empty error:', error);
    return res.status(500).json({ error: 'Failed to empty recycle bin' });
  }
};
