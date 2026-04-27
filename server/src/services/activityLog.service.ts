/**
 * Activity Log Service
 * Handle activity log operations with Firestore
 */

import { db } from '../config/firebase-admin.js';
import type { ActivityLog, CreateActivityLogDTO, ActivityLogFilters } from '@shared/types/activity.types';

const COLLECTION_NAME = 'activityLog';

/**
 * Create a new activity log entry
 */
export const createActivityLog = async (data: CreateActivityLogDTO): Promise<ActivityLog> => {
  const activityLogRef = db.collection(COLLECTION_NAME).doc();

  const activityLog: ActivityLog = {
    id: activityLogRef.id,
    ...data,
    timestamp: new Date().toISOString()
  };

  await activityLogRef.set(activityLog);

  console.log(`📝 Activity logged: ${data.action} ${data.resource} by ${data.userName}`);

  return activityLog;
};

/**
 * Get activity logs with filters
 */
export const getActivityLogs = async (filters: ActivityLogFilters = {}): Promise<ActivityLog[]> => {
  let query = db.collection(COLLECTION_NAME).orderBy('timestamp', 'desc');

  // Apply filters
  if (filters.userId) {
    query = query.where('userId', '==', filters.userId) as any;
  }

  if (filters.action) {
    query = query.where('action', '==', filters.action) as any;
  }

  if (filters.resource) {
    query = query.where('resource', '==', filters.resource) as any;
  }

  // Apply pagination
  const limit = filters.limit || 50;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  query = query.limit(limit).offset(offset) as any;

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => doc.data() as ActivityLog);
};

/**
 * Get activity log by ID
 */
export const getActivityLogById = async (id: string): Promise<ActivityLog | null> => {
  const doc = await db.collection(COLLECTION_NAME).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as ActivityLog;
};

/**
 * Delete old activity logs (cleanup)
 */
export const deleteOldActivityLogs = async (daysToKeep: number = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where('timestamp', '<', cutoffDate.toISOString())
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log(`🗑️ Deleted ${snapshot.size} old activity logs`);

  return snapshot.size;
};
