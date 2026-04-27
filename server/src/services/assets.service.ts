/**
 * Assets Service
 * Firestore CRUD for asset & resource accountability
 */

import { db } from '../config/firebase-admin.js';
import type { Asset, CreateAssetDTO, IssueAssetDTO, ReturnAssetDTO } from '@shared/types/assets.types';

const COLLECTION = 'assets';

export const getAllAssets = async (): Promise<Asset[]> => {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('category', 'asc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Asset));
};

export const getAssetById = async (id: string): Promise<Asset | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Asset;
};

export const createAsset = async (
  data: CreateAssetDTO,
  _userId: string,
  userName: string
): Promise<Asset> => {
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const asset: Asset = {
    id: ref.id,
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy: userName,
    updatedBy: userName,
  };
  await ref.set(asset);
  return asset;
};

export const updateAsset = async (
  id: string,
  data: Partial<CreateAssetDTO>,
  userName: string
): Promise<Asset | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updates = { ...data, updatedAt: new Date().toISOString(), updatedBy: userName };
  await ref.update(updates);
  return { id, ...existing.data(), ...updates } as Asset;
};

export const issueAsset = async (
  id: string,
  dto: IssueAssetDTO,
  userName: string
): Promise<Asset | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updates = {
    status: 'Issued',
    issuedToId:    dto.issuedToId,
    issuedToName:  dto.issuedToName,
    issuedDate:    dto.issuedDate,
    expectedReturn: dto.expectedReturn ?? null,
    returnedDate:  null,
    updatedAt: new Date().toISOString(),
    updatedBy: userName,
  };
  await ref.update(updates);
  return { id, ...existing.data(), ...updates } as Asset;
};

export const returnAsset = async (
  id: string,
  dto: ReturnAssetDTO,
  userName: string
): Promise<Asset | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updates = {
    status: 'Returned',
    returnedDate: dto.returnedDate,
    condition:    dto.condition,
    updatedAt: new Date().toISOString(),
    updatedBy: userName,
  };
  await ref.update(updates);
  return { id, ...existing.data(), ...updates } as Asset;
};

export const deleteAsset = async (id: string): Promise<boolean> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
};
