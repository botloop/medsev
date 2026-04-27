import { db } from '../config/firebase-admin.js';
import type { SavedReport, CreateSavedReportDTO, ReportType } from '../../../shared/types/savedReports.types.js';

const COLLECTION = 'savedReports';

export const getAllSavedReports = async (reportType?: ReportType): Promise<SavedReport[]> => {
  const snapshot = await db.collection(COLLECTION).orderBy('savedAt', 'desc').get();
  const all = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as SavedReport[];
  return reportType ? all.filter(r => r.reportType === reportType) : all;
};

export const getSavedReportById = async (id: string): Promise<SavedReport | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as SavedReport;
};

export const createSavedReport = async (
  data: CreateSavedReportDTO,
  savedBy: string
): Promise<SavedReport> => {
  const ref = db.collection(COLLECTION).doc();
  const report: SavedReport = { id: ref.id, ...data, savedAt: new Date().toISOString(), savedBy };
  await ref.set(report);
  return report;
};

export const deleteSavedReport = async (id: string): Promise<boolean> => {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
};
