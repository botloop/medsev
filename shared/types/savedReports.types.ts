export type ReportType = 'summary' | 'medeval';

export interface SavedReportConfig {
  unitName?: string;
  unitAddress?: string;
  reportMonth?: number;
  reportYear?: number;
  preparedBy?: string;
  notedBy?: string;
  lateralEntry?: number;
  reEntry?: number;
  promotion?: number;
  foreignSchool?: number;
  localSchool?: number;
  purpose?: string;
  doctor?: string;
  releasingOfficer?: string;
  reportTime?: string;
  physProfile?: string;
  filterMonth?: number;
  filterYear?: number;
}

export interface SavedReportCounts {
  commissionship?: number;
  enlistment?: number;
  cad?: number;
  reEnlistment?: number;
  totalA?: number;
  totalB?: number;
  totalPersonnel?: number;
}

export interface SavedReport {
  id: string;
  reportType: ReportType;
  title: string;
  controlNumber: string;
  reportDate: string;
  savedAt: string;
  savedBy: string;
  config: SavedReportConfig;
  counts: SavedReportCounts;
}

export interface CreateSavedReportDTO {
  reportType: ReportType;
  title: string;
  controlNumber: string;
  reportDate: string;
  config: SavedReportConfig;
  counts: SavedReportCounts;
}
