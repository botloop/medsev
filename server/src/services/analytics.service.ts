/**
 * Analytics Service
 * Business logic for analytics and statistics
 */

import { db } from '../config/firebase-admin.js';
import type { Personnel } from '../../../shared/types/personnel.types.js';
import type {
  AnalyticsOverview,
  OfficersEnlistedData,
  JoinYearData,
  MedicalStatusData,
  ReenlistmentData,
  ReenlistmentByMonthData
} from '../../../shared/types/common.types.js';
import { isOfficer } from '../../../shared/constants/ranks.js';

const PERSONNEL_COLLECTION = 'personnel';
const LAB_RESULTS_COLLECTION = 'labResults';

/**
 * Get overview statistics
 */
export const getOverviewStats = async (): Promise<AnalyticsOverview> => {
  const personnelSnapshot = await db.collection(PERSONNEL_COLLECTION).get();
  const personnel = personnelSnapshot.docs.map((doc) => doc.data() as Personnel);

  const labResultsSnapshot = await db.collection(LAB_RESULTS_COLLECTION).get();

  const totalPersonnel = personnel.length;
  const activeRecords = personnel.length; // All records are active
  const totalLabResults = labResultsSnapshot.size;
  const medicalCleared = personnel.filter((p) => p.medicalStatus?.cleared).length;

  return {
    totalPersonnel,
    activeRecords,
    totalLabResults,
    medicalCleared
  };
};

/**
 * Get Officers vs Enlisted data
 */
export const getOfficersEnlistedData = async (): Promise<OfficersEnlistedData> => {
  const snapshot = await db.collection(PERSONNEL_COLLECTION).get();
  const personnel = snapshot.docs.map((doc) => doc.data() as Personnel);

  const officers = personnel.filter((p) => isOfficer(p.rank)).length;
  const enlisted = personnel.filter((p) => !isOfficer(p.rank)).length;

  return { officers, enlisted };
};

/**
 * Get join year distribution
 */
export const getJoinYearData = async (): Promise<JoinYearData[]> => {
  const snapshot = await db.collection(PERSONNEL_COLLECTION).get();
  const personnel = snapshot.docs.map((doc) => doc.data() as Personnel);

  // Group by join year
  const yearCounts: { [year: number]: number } = {};

  personnel.forEach((p) => {
    const year = new Date(p.dateJoined).getFullYear();
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  // Convert to array and sort by year
  const data: JoinYearData[] = Object.entries(yearCounts)
    .map(([year, count]) => ({
      year: parseInt(year),
      count
    }))
    .sort((a, b) => a.year - b.year);

  return data;
};

/**
 * Get medical status distribution
 */
export const getMedicalStatusData = async (): Promise<MedicalStatusData> => {
  const snapshot = await db.collection(PERSONNEL_COLLECTION).get();
  const personnel = snapshot.docs.map((doc) => doc.data() as Personnel);

  const stats: MedicalStatusData = {
    step1: 0,
    step2: 0,
    step3: 0,
    step4: 0,
    step5: 0,
    step6: 0,
    step7: 0,
    step8: 0
  };

  personnel.forEach((p) => {
    // Count completed steps with null safety
    if (p.medicalStatus?.step1?.completed) stats.step1++;
    if (p.medicalStatus?.step2?.completed) stats.step2++;
    if (p.medicalStatus?.step3?.completed) stats.step3++;
    if (p.medicalStatus?.step4?.completed) stats.step4++;
    if (p.medicalStatus?.step5?.completed) stats.step5++;
    if (p.medicalStatus?.step6?.completed) stats.step6++;
    if (p.medicalStatus?.step7?.completed) stats.step7++;
    if (p.medicalStatus?.step8?.completed) stats.step8++;
  });

  return stats;
};

/**
 * Get re-enlistment status distribution
 */
export const getReenlistmentData = async (): Promise<ReenlistmentData> => {
  const snapshot = await db.collection(PERSONNEL_COLLECTION).get();
  const personnel = snapshot.docs.map((doc) => doc.data() as Personnel);

  // Filter enlisted personnel only (officers don't re-enlist)
  const enlisted = personnel.filter((p) => !isOfficer(p.rank));

  let firstTerm = 0;
  let reenlisted = 0;
  let eligible = 0;

  enlisted.forEach((p) => {
    const status = p.reEnlistmentStatus?.toLowerCase() || '';

    if (status.includes('first term')) {
      firstTerm++;
    } else if (status.includes('re-enlisted') || status.includes('2nd term') || status.includes('3rd')) {
      reenlisted++;
    } else if (status.includes('eligible')) {
      eligible++;
    }
  });

  return {
    firstTerm,
    reenlisted,
    eligible
  };
};

/**
 * Get re-enlistment completion count by month for the current year
 * Uses the ETE (Expiration of Term of Enlistment) date field
 */
export const getReenlistmentByMonthData = async (): Promise<ReenlistmentByMonthData[]> => {
  const snapshot = await db.collection(PERSONNEL_COLLECTION).get();
  const personnel = snapshot.docs.map((doc) => doc.data() as Personnel);

  const currentYear = new Date().getFullYear();
  const MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  const counts: number[] = new Array(12).fill(0);

  personnel.forEach((p) => {
    if (!p.ete) return;
    const ete = new Date(p.ete as string);
    if (ete.getFullYear() === currentYear) {
      counts[ete.getMonth()]++;
    }
  });

  return MONTH_NAMES.map((monthName, idx) => ({
    month: idx + 1,
    monthName,
    count: counts[idx]
  }));
};

/**
 * Get all analytics data in one call
 */
export const getAllAnalytics = async () => {
  const [overview, officersEnlisted, joinYear, medicalStatus, reenlistment, reenlistmentByMonth] = await Promise.all([
    getOverviewStats(),
    getOfficersEnlistedData(),
    getJoinYearData(),
    getMedicalStatusData(),
    getReenlistmentData(),
    getReenlistmentByMonthData()
  ]);

  return {
    overview,
    officersEnlisted,
    joinYear,
    medicalStatus,
    reenlistment,
    reenlistmentByMonth
  };
};
