/**
 * Assets Controller
 * HTTP handlers for asset & resource accountability
 */

import { Request, Response } from 'express';
import * as service from '../services/assets.service.js';
import { createActivityLog } from '../services/activityLog.service.js';
import { moveToRecycleBin } from '../services/recycleBin.service.js';

const getUser = (req: Request) => ({
  uid:   (req as any).user?.uid || 'unknown',
  name:  (req as any).user?.displayName || (req as any).user?.email || 'Unknown User',
  email: (req as any).user?.email || '',
});

export const getAll = async (req: Request, res: Response) => {
  try {
    const assets = await service.getAllAssets();
    return res.json(assets);
  } catch (error) {
    console.error('getAll assets error:', error);
    return res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const asset = await service.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const asset = await service.createAsset(req.body, uid, name);
    await createActivityLog({
      userId:      uid,
      userName:    name,
      action:      'create',
      resource:    'asset',
      resourceId:  asset.id,
      description: `Added asset: ${asset.name} [${asset.category}]`,
      metadata:    { assetId: asset.id, category: asset.category },
    });
    return res.status(201).json(asset);
  } catch (error) {
    console.error('create asset error:', error);
    return res.status(500).json({ error: 'Failed to create asset' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const asset = await service.updateAsset(req.params.id, req.body, name);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await createActivityLog({
      userId:      uid,
      userName:    name,
      action:      'update',
      resource:    'asset',
      resourceId:  asset.id,
      description: `Updated asset: ${asset.name}`,
      metadata:    { assetId: asset.id },
    });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update asset' });
  }
};

export const issue = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const asset = await service.issueAsset(req.params.id, req.body, name);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await createActivityLog({
      userId:      uid,
      userName:    name,
      action:      'update',
      resource:    'asset',
      resourceId:  asset.id,
      description: `Issued asset "${asset.name}" to ${asset.issuedToName}`,
      metadata:    { assetId: asset.id, issuedTo: asset.issuedToName, issuedDate: asset.issuedDate },
    });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to issue asset' });
  }
};

export const returnAsset = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const asset = await service.returnAsset(req.params.id, req.body, name);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await createActivityLog({
      userId:      uid,
      userName:    name,
      action:      'update',
      resource:    'asset',
      resourceId:  asset.id,
      description: `Returned asset "${asset.name}" from ${asset.issuedToName} — condition: ${asset.condition}`,
      metadata:    { assetId: asset.id, returnedDate: asset.returnedDate, condition: asset.condition },
    });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to return asset' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { uid, name } = getUser(req);
    const asset = await service.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    await moveToRecycleBin(
      'asset',
      req.params.id,
      `${asset.name} [${asset.category}]`,
      asset as unknown as Record<string, unknown>,
      name
    );
    await service.deleteAsset(req.params.id);

    await createActivityLog({
      userId:      uid,
      userName:    name,
      action:      'delete',
      resource:    'asset',
      resourceId:  req.params.id,
      description: `Moved asset "${asset.name}" to recycle bin`,
      metadata:    { assetId: req.params.id },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
};
