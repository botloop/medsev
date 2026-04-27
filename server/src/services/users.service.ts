/**
 * Users Service
 * Firestore CRUD for user management
 */

import { db, auth } from '../config/firebase-admin.js';
import { getRolePermissions } from '../../../shared/constants/permissions.js';
import type { User, UserRole } from '@shared/types/auth.types';

const COLLECTION = 'users';

export const getAllUsers = async (): Promise<User[]> => {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => doc.data() as User);
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as User;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<User | null> => {
  const ref = db.collection(COLLECTION).doc(uid);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const permissions = getRolePermissions(role);
  await ref.update({ role, permissions, updatedAt: new Date().toISOString() });

  return { ...doc.data() as User, role, permissions };
};

export const deleteUser = async (uid: string): Promise<boolean> => {
  const ref = db.collection(COLLECTION).doc(uid);
  const doc = await ref.get();
  if (!doc.exists) return false;

  // Delete from Firestore
  await ref.delete();

  // Attempt to delete from Firebase Auth (non-fatal if it fails)
  try {
    await auth.deleteUser(uid);
  } catch {
    // user may not exist in Firebase Auth (e.g. serial-only accounts)
  }

  return true;
};
