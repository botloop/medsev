import { db } from '../config/firebase-admin.js';
import type { InventoryItem, CreateInventoryDTO, UpdateInventoryDTO } from '../../../shared/types/inventory.types.js';

const COLLECTION = 'inventory';

export const getAllItems = async (): Promise<InventoryItem[]> => {
  const snap = await db.collection(COLLECTION).orderBy('name').get();
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as InventoryItem));
};

export const getItemById = async (id: string): Promise<InventoryItem | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { ...doc.data(), id: doc.id } as InventoryItem;
};

export const getItemByQrCode = async (qrCode: string): Promise<InventoryItem | null> => {
  const snap = await db.collection(COLLECTION).where('qrCode', '==', qrCode).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...doc.data(), id: doc.id } as InventoryItem;
};

export const createItem = async (data: CreateInventoryDTO, userId: string): Promise<InventoryItem> => {
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now, createdBy: userId, updatedBy: userId };
  const ref = await db.collection(COLLECTION).add(payload);
  return { ...payload, id: ref.id };
};

export const updateItem = async (id: string, data: UpdateInventoryDTO, userId: string): Promise<InventoryItem> => {
  const ref = db.collection(COLLECTION).doc(id);
  await ref.update({ ...data, updatedAt: new Date().toISOString(), updatedBy: userId });
  const snap = await ref.get();
  return { ...snap.data(), id: snap.id } as InventoryItem;
};

export const deleteItem = async (id: string): Promise<void> => {
  await db.collection(COLLECTION).doc(id).delete();
};

export const getExpiringItems = async (withinDays = 30): Promise<InventoryItem[]> => {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  const snap = await db.collection(COLLECTION).get();
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id } as InventoryItem))
    .filter(item => {
      if (!item.expirationDate) return false;
      const exp = new Date(item.expirationDate);
      return exp >= now && exp <= cutoff;
    });
};
