import { db } from '../config/firebase-admin.js';
import type { ReEnlistmentRecord, CreateReEnlistmentDTO, UpdateReEnlistmentDTO, ReEnlistmentStep } from '../../../shared/types/reEnlistment.types.js';

const COLLECTION = 'reEnlistmentRecords';

const emptyStep = (): ReEnlistmentStep => ({ completed: false });

const buildEmpty = (data: CreateReEnlistmentDTO): Omit<ReEnlistmentRecord, 'id'> => ({
  personnelId: data.personnelId,
  userId: data.userId,
  eteDate: data.eteDate,
  status: 'in-progress',
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: {
    prePhysical:        emptyStep(),
    medicalExam:        emptyStep(),
    dental:             emptyStep(),
    labTests:           emptyStep(),
    psychiatric:        emptyStep(),
    documentSubmission: emptyStep(),
  },
});

export const getRecordsByPersonnelId = async (personnelId: string): Promise<ReEnlistmentRecord[]> => {
  const snap = await db.collection(COLLECTION).where('personnelId', '==', personnelId).get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as ReEnlistmentRecord))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
};

export const getRecordByUserId = async (userId: string): Promise<ReEnlistmentRecord | null> => {
  const snap = await db.collection(COLLECTION).where('userId', '==', userId).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ReEnlistmentRecord;
};

export const createRecord = async (data: CreateReEnlistmentDTO): Promise<ReEnlistmentRecord> => {
  const doc = buildEmpty(data);
  const ref = await db.collection(COLLECTION).add(doc);
  return { id: ref.id, ...doc };
};

export const updateRecord = async (id: string, updates: UpdateReEnlistmentDTO): Promise<ReEnlistmentRecord> => {
  const ref = db.collection(COLLECTION).doc(id);
  const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (updates.status) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.steps) {
    for (const [key, val] of Object.entries(updates.steps)) {
      payload[`steps.${key}`] = val;
    }
  }
  await ref.update(payload);
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() } as ReEnlistmentRecord;
};
