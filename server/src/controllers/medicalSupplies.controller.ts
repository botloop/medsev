/**
 * Medical Supplies Controller
 */

import { Request, Response } from 'express';
import * as service from '../services/medicalSupplies.service.js';
import { createActivityLog } from '../services/activityLog.service.js';
import { moveToRecycleBin } from '../services/recycleBin.service.js';

const getUser = (req: Request) => ({
  uid: (req as any).user?.uid || 'unknown',
  name: (req as any).user?.displayName || (req as any).user?.email || 'Unknown User',
});

export const getAll = async (req: Request, res: Response) => {
  try {
    const supplies = await service.getAllSupplies();
    return res.json(supplies);
  } catch (error) {
    console.error('getAll supplies error:', error);
    return res.status(500).json({ error: 'Failed to fetch medical supplies' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const supply = await service.getSupplyById(req.params.id);
    if (!supply) return res.status(404).json({ error: 'Supply not found' });
    return res.json(supply);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch supply' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const supply = await service.createSupply(req.body, uid, name);
    await createActivityLog({
      userId: uid,
      userName: name,
      action: 'create',
      resource: 'medicalSupply',
      resourceId: supply.id,
      description: `Added medical supply: ${supply.name} (${supply.quantity} ${supply.unit})`,
      metadata: { supplyId: supply.id },
    });
    return res.status(201).json(supply);
  } catch (error) {
    console.error('create supply error:', error);
    return res.status(500).json({ error: 'Failed to create supply' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const supply = await service.updateSupply(req.params.id, req.body, name);
    if (!supply) return res.status(404).json({ error: 'Supply not found' });
    await createActivityLog({
      userId: uid,
      userName: name,
      action: 'update',
      resource: 'medicalSupply',
      resourceId: supply.id,
      description: `Updated medical supply: ${supply.name}`,
      metadata: { supplyId: supply.id },
    });
    return res.json(supply);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update supply' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const supply = await service.getSupplyById(req.params.id);
    if (!supply) return res.status(404).json({ error: 'Supply not found' });

    await moveToRecycleBin(
      'medical-supply',
      req.params.id,
      supply.name,
      supply as unknown as Record<string, unknown>,
      name
    );
    await service.deleteSupply(req.params.id);

    await createActivityLog({
      userId: uid,
      userName: name,
      action: 'delete',
      resource: 'medicalSupply',
      resourceId: req.params.id,
      description: `Moved medical supply "${supply.name}" to recycle bin`,
      metadata: { supplyId: req.params.id },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete supply' });
  }
};
