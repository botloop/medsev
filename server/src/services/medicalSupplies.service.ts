/**
 * Medical Supplies Service
 * Firestore CRUD for medical supplies inventory
 */

import { db } from '../config/firebase-admin.js';
import type { MedicalSupply, CreateMedicalSupplyDTO } from '@shared/types/medicalSupplies.types';

const COLLECTION = 'medicalSupplies';

export const getAllSupplies = async (): Promise<MedicalSupply[]> => {
  const snapshot = await db.collection(COLLECTION).orderBy('name', 'asc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MedicalSupply));
};

export const getSupplyById = async (id: string): Promise<MedicalSupply | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as MedicalSupply;
};

export const createSupply = async (
  data: CreateMedicalSupplyDTO,
  userId: string,
  userName: string
): Promise<MedicalSupply> => {
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const supply: MedicalSupply = {
    id: ref.id,
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy: userName,
    updatedBy: userName,
  };
  await ref.set(supply);
  return supply;
};

export const updateSupply = async (
  id: string,
  data: Partial<CreateMedicalSupplyDTO>,
  userName: string
): Promise<MedicalSupply | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updates = { ...data, updatedAt: new Date().toISOString(), updatedBy: userName };
  await ref.update(updates);
  return { id, ...existing.data(), ...updates } as MedicalSupply;
};

export const deleteSupply = async (id: string): Promise<boolean> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
};
