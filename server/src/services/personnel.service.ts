/**
 * Personnel Service
 * Business logic and Firestore operations for personnel management
 */

import { db } from '../config/firebase-admin.js';
import type { Personnel, CreatePersonnelDTO, PersonnelFilters, ClinicalRecord, CreateClinicalRecordDTO } from '../../../shared/types/personnel.types.js';
import type { PaginatedResponse } from '../../../shared/types/common.types.js';

const COLLECTION = 'personnel';

/**
 * Get all personnel with filtering, pagination, and sorting
 */
export const getAllPersonnel = async (
  filters: PersonnelFilters = {}
): Promise<PaginatedResponse<Personnel>> => {
  const {
    search,
    rank,
    unit,
    medicalCleared,
    page = 1,
    limit = 50,
    sortBy = 'lastName',
    sortOrder = 'asc'
  } = filters;

  let query = db.collection(COLLECTION).orderBy(sortBy, sortOrder);

  // Apply filters
  if (rank) {
    query = query.where('rank', '==', rank) as any;
  }

  if (unit) {
    query = query.where('unit', '==', unit) as any;
  }

  if (medicalCleared !== undefined) {
    query = query.where('medicalStatus.cleared', '==', medicalCleared) as any;
  }

  // Get total count (without pagination)
  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count;

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset) as any;

  const snapshot = await query.get();

  let personnel = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Personnel[];

  // Apply search filter (client-side for name search)
  if (search) {
    const searchLower = search.toLowerCase();
    personnel = personnel.filter((p) => {
      const fullName = `${p.firstName} ${p.middleName || ''} ${p.lastName}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        p.serialNumber.toLowerCase().includes(searchLower) ||
        p.rank.toLowerCase().includes(searchLower)
      );
    });
  }

  return {
    data: personnel,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get personnel by ID
 */
export const getPersonnelById = async (id: string): Promise<Personnel | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  } as Personnel;
};

/**
 * Get personnel by serial number
 */
export const getPersonnelBySerial = async (serialNumber: string): Promise<Personnel | null> => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('serialNumber', '==', serialNumber.toUpperCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Personnel;
};

/**
 * Create new personnel
 */
export const createPersonnel = async (
  data: CreatePersonnelDTO,
  userId: string
): Promise<Personnel> => {
  // Check if serial number already exists
  const existing = await getPersonnelBySerial(data.serialNumber);
  if (existing) {
    throw new Error('Serial number already exists');
  }

  // Initialize medical status with provided steps or defaults
  const steps = data.medicalSteps || {};
  const medicalStatus = {
    step1: { completed: steps.step1 || false },
    step2: { completed: steps.step2 || false },
    step3: { completed: steps.step3 || false },
    step4: { completed: steps.step4 || false },
    step5: { completed: steps.step5 || false },
    step6: { completed: steps.step6 || false },
    step7: { completed: steps.step7 || false },
    step8: { completed: steps.step8 || false },
    cleared: false
  };

  // Auto-mark as cleared if all steps are completed
  const allStepsCompleted = [
    medicalStatus.step1.completed,
    medicalStatus.step2.completed,
    medicalStatus.step3.completed,
    medicalStatus.step4.completed,
    medicalStatus.step5.completed,
    medicalStatus.step6.completed,
    medicalStatus.step7.completed,
    medicalStatus.step8.completed
  ].every(completed => completed === true);

  if (allStepsCompleted) {
    medicalStatus.cleared = true;
    medicalStatus.clearedDate = new Date().toISOString();
  }

  const now = new Date().toISOString();

  const personnelData = {
    ...data,
    serialNumber: data.serialNumber.toUpperCase(),
    medicalStatus,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId
  };

  const docRef = await db.collection(COLLECTION).add(personnelData);
  const doc = await docRef.get();

  return {
    id: doc.id,
    ...doc.data()
  } as Personnel;
};

/**
 * Update personnel
 */
export const updatePersonnel = async (
  id: string,
  data: Partial<CreatePersonnelDTO>,
  userId: string
): Promise<Personnel | null> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  // If updating serial number, check for duplicates
  if (data.serialNumber) {
    const existing = await getPersonnelBySerial(data.serialNumber);
    if (existing && existing.id !== id) {
      throw new Error('Serial number already exists');
    }
    data.serialNumber = data.serialNumber.toUpperCase();
  }

  const updateData: any = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: userId
  };

  // Handle medical steps update
  if (data.medicalSteps) {
    const currentData = doc.data() as Personnel;
    const steps = data.medicalSteps;

    const medicalStatus: any = {
      step1: { completed: steps.step1 !== undefined ? steps.step1 : currentData.medicalStatus.step1.completed },
      step2: { completed: steps.step2 !== undefined ? steps.step2 : currentData.medicalStatus.step2.completed },
      step3: { completed: steps.step3 !== undefined ? steps.step3 : currentData.medicalStatus.step3.completed },
      step4: { completed: steps.step4 !== undefined ? steps.step4 : currentData.medicalStatus.step4.completed },
      step5: { completed: steps.step5 !== undefined ? steps.step5 : currentData.medicalStatus.step5.completed },
      step6: { completed: steps.step6 !== undefined ? steps.step6 : currentData.medicalStatus.step6.completed },
      step7: { completed: steps.step7 !== undefined ? steps.step7 : currentData.medicalStatus.step7.completed },
      step8: { completed: steps.step8 !== undefined ? steps.step8 : currentData.medicalStatus.step8.completed },
      cleared: currentData.medicalStatus.cleared
    };

    // Auto-mark as cleared if all steps are completed
    const allStepsCompleted = [
      medicalStatus.step1.completed,
      medicalStatus.step2.completed,
      medicalStatus.step3.completed,
      medicalStatus.step4.completed,
      medicalStatus.step5.completed,
      medicalStatus.step6.completed,
      medicalStatus.step7.completed,
      medicalStatus.step8.completed
    ].every(completed => completed === true);

    if (allStepsCompleted && !medicalStatus.cleared) {
      medicalStatus.cleared = true;
      medicalStatus.clearedDate = new Date().toISOString();
    } else if (!allStepsCompleted && medicalStatus.cleared) {
      // Unmark cleared if steps are incomplete
      medicalStatus.cleared = false;
      // Don't include clearedDate if not set
    } else if (currentData.medicalStatus.clearedDate) {
      // Preserve existing clearedDate if status hasn't changed
      medicalStatus.clearedDate = currentData.medicalStatus.clearedDate;
    }

    updateData.medicalStatus = medicalStatus;

    delete updateData.medicalSteps;
  }

  await docRef.update(updateData);

  // Sync editable fields back to the linked personnelRequest document
  const syncableFields = [
    'serialNumber', 'firstName', 'middleName', 'lastName', 'birthdate',
    'rank', 'unit', 'gender', 'bloodType', 'permanentAddress', 'designation',
    'contactNumber', 'email', 'dateJoined', 'ete', 'reEnlistmentStatus',
    'cadProgram', 'processType',
  ] as const;
  const syncData: Record<string, unknown> = {};
  for (const field of syncableFields) {
    if ((data as any)[field] !== undefined) {
      syncData[`data.${field}`] = (data as any)[field];
    }
  }
  if (Object.keys(syncData).length > 0) {
    const userSnap = await db.collection('users').where('linkedPersonnelId', '==', id).limit(1).get();
    if (!userSnap.empty) {
      const linkedUserId = userSnap.docs[0].id;
      const reqSnap = await db.collection('personnelRequests')
        .where('userId', '==', linkedUserId)
        .where('status', '==', 'approved')
        .limit(1)
        .get();
      if (!reqSnap.empty) {
        await reqSnap.docs[0].ref.update(syncData);
      }
    }
  }

  const updated = await docRef.get();
  return {
    id: updated.id,
    ...updated.data()
  } as Personnel;
};

/**
 * Delete personnel
 */
export const deletePersonnel = async (id: string): Promise<boolean> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return false;
  }

  await docRef.delete();
  return true;
};

/**
 * Update medical status step
 */
export const updateMedicalStatus = async (
  id: string,
  step: number,
  completed: boolean,
  notes?: string,
  userId?: string
): Promise<Personnel | null> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const personnel = doc.data() as Personnel;
  const stepKey = `step${step}` as keyof typeof personnel.medicalStatus;

  const updatedStep = {
    completed,
    date: completed ? new Date().toISOString() : undefined,
    notes
  };

  // Check if all steps are completed
  const allStepsCompleted =
    Object.keys(personnel.medicalStatus)
      .filter((key) => key.startsWith('step'))
      .every((key) => {
        if (key === stepKey) return completed;
        return (personnel.medicalStatus as any)[key].completed;
      });

  const updateData: any = {
    [`medicalStatus.${stepKey}`]: updatedStep,
    updatedAt: new Date().toISOString()
  };

  if (userId) {
    updateData.updatedBy = userId;
  }

  // Update cleared status if all steps are done
  if (allStepsCompleted) {
    updateData['medicalStatus.cleared'] = true;
    updateData['medicalStatus.clearedDate'] = new Date().toISOString();
  } else {
    updateData['medicalStatus.cleared'] = false;
    updateData['medicalStatus.clearedDate'] = null;
  }

  await docRef.update(updateData);

  const updated = await docRef.get();
  return {
    id: updated.id,
    ...updated.data()
  } as Personnel;
};

/**
 * Get all clinical records for a personnel
 */
export const getClinicalRecords = async (personnelId: string): Promise<ClinicalRecord[]> => {
  const snapshot = await db
    .collection(COLLECTION)
    .doc(personnelId)
    .collection('clinicalRecords')
    .orderBy('date', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    personnelId,
    ...doc.data()
  })) as ClinicalRecord[];
};

/**
 * Create a clinical record
 */
export const createClinicalRecord = async (
  personnelId: string,
  data: CreateClinicalRecordDTO,
  userId: string
): Promise<ClinicalRecord> => {
  const now = new Date().toISOString();
  const recordData = {
    ...data,
    personnelId,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId
  };

  const docRef = await db
    .collection(COLLECTION)
    .doc(personnelId)
    .collection('clinicalRecords')
    .add(recordData);

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() } as ClinicalRecord;
};

/**
 * Update a clinical record
 */
export const updateClinicalRecord = async (
  personnelId: string,
  recordId: string,
  data: Partial<CreateClinicalRecordDTO>,
  userId: string
): Promise<ClinicalRecord | null> => {
  const docRef = db
    .collection(COLLECTION)
    .doc(personnelId)
    .collection('clinicalRecords')
    .doc(recordId);

  const doc = await docRef.get();
  if (!doc.exists) return null;

  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: userId
  };

  await docRef.update(updateData);
  const updated = await docRef.get();
  return { id: updated.id, ...updated.data() } as ClinicalRecord;
};

/**
 * Delete a clinical record
 */
export const deleteClinicalRecord = async (
  personnelId: string,
  recordId: string
): Promise<boolean> => {
  const docRef = db
    .collection(COLLECTION)
    .doc(personnelId)
    .collection('clinicalRecords')
    .doc(recordId);

  const doc = await docRef.get();
  if (!doc.exists) return false;

  await docRef.delete();
  return true;
};

/**
 * Get personnel statistics
 */
export const getPersonnelStats = async () => {
  const snapshot = await db.collection(COLLECTION).get();
  const personnel = snapshot.docs.map((doc) => doc.data() as Personnel);

  const totalPersonnel = personnel.length;
  const activeRecords = personnel.length; // All records are active for now
  const medicalCleared = personnel.filter((p) => p.medicalStatus.cleared).length;

  return {
    totalPersonnel,
    activeRecords,
    medicalCleared
  };
};
