/**
 * Re-Enlistment Types
 * Shared between client and server
 */

export interface ReEnlistmentStep {
  completed: boolean;
  date?: string;       // ISO date
  result?: string;     // 'Pass' | 'Fail' | 'Pending'
  notes?: string;
  files?: ReEnlistmentFile[];
}

export interface ReEnlistmentFile {
  fileName: string;
  fileURL: string;
  cloudinaryPublicId?: string;
  uploadedAt: string;
  uploadedBy: string;
  fileType: string;
  fileSize: number;
}

export interface ReEnlistmentRecord {
  id: string;
  personnelId: string;
  userId: string;
  eteDate: string;      // copy of ETE at time of record creation
  status: 'in-progress' | 'completed' | 'denied';
  startedAt: string;
  updatedAt: string;
  steps: {
    prePhysical:        ReEnlistmentStep;
    medicalExam:        ReEnlistmentStep;
    dental:             ReEnlistmentStep;
    labTests:           ReEnlistmentStep;
    psychiatric:        ReEnlistmentStep;
    documentSubmission: ReEnlistmentStep;
  };
  notes?: string;
}

export const REENLISTMENT_STEP_LABELS: Record<keyof ReEnlistmentRecord['steps'], string> = {
  prePhysical:        'Pre-Physical Examination',
  medicalExam:        'Medical Examination',
  dental:             'Dental Examination',
  labTests:           'Laboratory Tests',
  psychiatric:        'Psychiatric Evaluation',
  documentSubmission: 'Document Submission',
};

export const EMPTY_REENLISTMENT_STEP: ReEnlistmentStep = {
  completed: false,
};

export interface CreateReEnlistmentDTO {
  personnelId: string;
  userId: string;
  eteDate: string;
}

export interface UpdateReEnlistmentDTO {
  status?: ReEnlistmentRecord['status'];
  notes?: string;
  steps?: Partial<ReEnlistmentRecord['steps']>;
}
