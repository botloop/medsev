import { db } from '../config/firebase-admin.js';
import type { PCRRecord, CreatePCRDTO, UpdatePCRDTO } from '../../../shared/types/pcr.types.js';

const COLLECTION = 'emergencyCases';

export const getAllPCRs = async (): Promise<PCRRecord[]> => {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as PCRRecord));
};

export const getPCRById = async (id: string): Promise<PCRRecord | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { ...doc.data(), id: doc.id } as PCRRecord;
};

export const createPCR = async (data: CreatePCRDTO, userId: string, userName: string): Promise<PCRRecord> => {
  const now = new Date().toISOString();
  const payload: Omit<PCRRecord, 'id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    createdByName: userName,
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return { id: ref.id, ...payload };
};

export const updatePCR = async (id: string, data: UpdatePCRDTO): Promise<PCRRecord> => {
  const ref = db.collection(COLLECTION).doc(id);
  await ref.update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await ref.get();
  return { ...snap.data(), id: snap.id } as PCRRecord;
};

export const deletePCR = async (id: string): Promise<void> => {
  await db.collection(COLLECTION).doc(id).delete();
};
