/**
 * Common Types
 * Shared between client and server
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface ActivityLogEntry {
    id: string;
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'upload';
    resource: 'personnel' | 'labResult' | 'user' | 'auth';
    resourceId: string;
    description: string;
    timestamp: Date | string;
    metadata?: Record<string, unknown>;
}
export interface LabResult {
    id: string;
    personnelId: string;
    personnelName: string;
    fileURL: string;
    fileName: string;
    fileType: string;
    uploadDate: Date | string;
    uploadedBy: string;
    uploadedByName: string;
    notes?: string;
}
export interface AnalyticsOverview {
    totalPersonnel: number;
    activeRecords: number;
    totalLabResults: number;
    medicalCleared: number;
}
export interface OfficersEnlistedData {
    officers: number;
    enlisted: number;
}
export interface JoinYearData {
    year: number;
    count: number;
}
export interface MedicalStatusData {
    step1: number;
    step2: number;
    step3: number;
    step4: number;
    step5: number;
    step6: number;
    step7: number;
    step8: number;
}
export interface ReenlistmentData {
    firstTerm: number;
    reenlisted: number;
    eligible: number;
}
//# sourceMappingURL=common.types.d.ts.map