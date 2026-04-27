/**
 * Personnel Requests Service
 * Viewer-submitted profile requests pending admin approval
 */

import { db } from '../config/firebase-admin.js';
import type { PersonnelRequest, PersonnelRequestData, PersonnelRequestStatus } from '@shared/types/personnelRequest.types';

const COLLECTION = 'personnelRequests';

export const getAllRequests = async (status?: PersonnelRequestStatus): Promise<PersonnelRequest[]> => {
  const snapshot = await db.collection(COLLECTION).get();
  const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonnelRequest));
  const filtered = status ? all.filter(r => r.status === status) : all;
  return filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const getRequestByUserId = async (userId: string): Promise<PersonnelRequest | null> => {
  const snapshot = await db.collection(COLLECTION).where('userId', '==', userId).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as PersonnelRequest;
};

export const createOrUpdateRequest = async (
  userId: string,
  userName: string,
  userEmail: string,
  data: PersonnelRequestData
): Promise<PersonnelRequest> => {
  // Check for existing request from this user
  const existing = await getRequestByUserId(userId);
  const now = new Date().toISOString();

  if (existing && existing.status !== 'approved') {
    // Update existing pending/rejected request
    const ref = db.collection(COLLECTION).doc(existing.id);
    const updates = { data, submittedAt: now, status: 'pending', rejectionReason: null, reviewedAt: null, reviewedBy: null };
    await ref.update(updates);
    return { ...existing, ...updates } as PersonnelRequest;
  }

  // Create new request
  const ref = db.collection(COLLECTION).doc();
  const request: PersonnelRequest = {
    id: ref.id,
    userId,
    userName,
    userEmail,
    status: 'pending',
    submittedAt: now,
    data,
  };
  await ref.set(request);
  return request;
};

export const approveRequest = async (id: string, adminName: string, personnelId?: string): Promise<PersonnelRequest | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updates: Record<string, any> = { status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: adminName };
  if (personnelId) updates.personnelId = personnelId;
  await ref.update(updates);
  return { id, ...doc.data(), ...updates } as PersonnelRequest;
};

export const rejectRequest = async (id: string, adminName: string, reason: string): Promise<PersonnelRequest | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updates = { status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: adminName, rejectionReason: reason };
  await ref.update(updates);
  return { id, ...doc.data(), ...updates } as PersonnelRequest;
};
