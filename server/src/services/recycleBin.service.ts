/**
 * Recycle Bin Service
 * Soft-delete via a dedicated Firestore collection; supports restore and permanent delete.
 */

import { db } from '../config/firebase-admin.js';

export type RecycleBinItemType = 'personnel' | 'asset' | 'medical-supply';

export interface RecycleBinItem {
  id: string;
  type: RecycleBinItemType;
  originalId: string;
  /** Human-readable display name */
  name: string;
  /** Full original document data */
  data: Record<string, unknown>;
  deletedAt: string;
  deletedBy: string;
}

const COLLECTION = 'recycle_bin';

const ORIGINAL_COLLECTION: Record<RecycleBinItemType, string> = {
  'personnel':      'personnel',
  'asset':          'assets',
  'medical-supply': 'medicalSupplies',
};

export const moveToRecycleBin = async (
  type: RecycleBinItemType,
  originalId: string,
  name: string,
  data: Record<string, unknown>,
  deletedBy: string
): Promise<RecycleBinItem> => {
  const ref = db.collection(COLLECTION).doc();
  const item: RecycleBinItem = {
    id: ref.id,
    type,
    originalId,
    name,
    data,
    deletedAt: new Date().toISOString(),
    deletedBy,
  };
  await ref.set(item);
  return item;
};

export const getAllRecycleBin = async (type?: RecycleBinItemType): Promise<RecycleBinItem[]> => {
  let query: FirebaseFirestore.Query = db.collection(COLLECTION).orderBy('deletedAt', 'desc');
  if (type) {
    query = db.collection(COLLECTION).where('type', '==', type).orderBy('deletedAt', 'desc');
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RecycleBinItem));
};

export const restoreItem = async (id: string): Promise<RecycleBinItem | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const item = doc.data() as RecycleBinItem;
  const targetCollection = ORIGINAL_COLLECTION[item.type];

  // Restore original document
  await db.collection(targetCollection).doc(item.originalId).set(item.data);
  // Remove from recycle bin
  await ref.delete();

  return item;
};

export const permanentDelete = async (id: string): Promise<boolean> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
};

export const emptyRecycleBin = async (type?: RecycleBinItemType): Promise<number> => {
  let query: FirebaseFirestore.Query = db.collection(COLLECTION);
  if (type) query = query.where('type', '==', type);

  const snapshot = await query.get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
};
