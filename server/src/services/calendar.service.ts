/**
 * Calendar Service
 * Firestore CRUD for calendar activities
 */

import { db } from '../config/firebase-admin.js';
import type { CalendarActivity, CreateCalendarActivityDTO } from '@shared/types/calendar.types';

const COLLECTION = 'calendarActivities';

export const getAllActivities = async (): Promise<CalendarActivity[]> => {
  const snapshot = await db.collection(COLLECTION).orderBy('date', 'asc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CalendarActivity));
};

export const getActivityById = async (id: string): Promise<CalendarActivity | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as CalendarActivity;
};

export const createActivity = async (
  data: CreateCalendarActivityDTO,
  userName: string
): Promise<CalendarActivity> => {
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const activity: CalendarActivity = {
    id: ref.id,
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy: userName,
    updatedBy: userName,
  };
  await ref.set(activity);
  return activity;
};

export const updateActivity = async (
  id: string,
  data: Partial<CreateCalendarActivityDTO>,
  userName: string
): Promise<CalendarActivity | null> => {
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;
  const updates = { ...data, updatedAt: new Date().toISOString(), updatedBy: userName };
  await ref.update(updates);
  return { id, ...existing.data(), ...updates } as CalendarActivity;
};

export const deleteActivity = async (id: string): Promise<boolean> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
};
