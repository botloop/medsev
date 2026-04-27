/**
 * Personnel Types
 * Shared between client and server for type safety
 */
export interface MedicalStep {
    completed: boolean;
    date?: Date | string;
    notes?: string;
    files?: MedicalResultFile[];
}
export interface MedicalResultFile {
    fileName: string;
    fileURL: string;
    cloudinaryPublicId?: string;
    uploadedAt: Date | string;
    uploadedBy: string;
    fileType: string;
    fileSize: number;
}
export interface MedicalStatus {
    step1: MedicalStep;
    step2: MedicalStep;
    step3: MedicalStep;
    step4: MedicalStep;
    step5: MedicalStep;
    step6: MedicalStep;
    step7: MedicalStep;
    step8: MedicalStep;
    cleared: boolean;
    clearedDate?: Date | string;
}
export interface Personnel {
    id: string;
    serialNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    birthdate: Date | string;
    rank: string;
    unit: string;
    contactNumber?: string;
    email?: string;
    dateJoined: Date | string;
    ete?: Date | string;
    reEnlistmentStatus?: string;
    cadProgram?: string;
    profilePhoto?: string;
    medicalStatus: MedicalStatus;
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy: string;
    updatedBy: string;
}
export interface CreatePersonnelDTO {
    serialNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    birthdate: Date | string;
    rank: string;
    unit: string;
    contactNumber?: string;
    email?: string;
    dateJoined: Date | string;
    ete?: Date | string;
    reEnlistmentStatus?: string;
    cadProgram?: string;
    medicalSteps?: {
        step1?: boolean;
        step2?: boolean;
        step3?: boolean;
        step4?: boolean;
        step5?: boolean;
        step6?: boolean;
        step7?: boolean;
        step8?: boolean;
    };
}
export interface UpdatePersonnelDTO extends Partial<CreatePersonnelDTO> {
    id: string;
}
export interface VitalSigns {
    bloodPressure?: string;
    heartRate?: string;
    respiratoryRate?: string;
    temperature?: string;
    spO2?: string;
    weight?: string;
    height?: string;
}
export interface ClinicalRecord {
    id: string;
    personnelId: string;
    date: Date | string;
    assessmentDateTime?: string;
    illnessOnsetDateTime?: string;
    gender?: string;
    complaint: string;
    diagnosis: string;
    treatment: string;
    physician: string;
    vitalSigns?: VitalSigns;
    physicalExam?: string;
    pmhx?: string;
    psHx?: string;
    fhx?: string;
    shx?: string;
    allergies?: string;
    medications?: string;
    covidVaccinated?: boolean;
    covidVaccineDetails?: string;
    notes?: string;
    createdAt: Date | string;
    createdBy: string;
    updatedAt: Date | string;
    updatedBy: string;
}
export interface CreateClinicalRecordDTO {
    date: Date | string;
    assessmentDateTime?: string;
    illnessOnsetDateTime?: string;
    gender?: string;
    complaint: string;
    diagnosis: string;
    treatment: string;
    physician: string;
    vitalSigns?: VitalSigns;
    physicalExam?: string;
    pmhx?: string;
    psHx?: string;
    fhx?: string;
    shx?: string;
    allergies?: string;
    medications?: string;
    covidVaccinated?: boolean;
    covidVaccineDetails?: string;
    notes?: string;
}
export interface PersonnelFilters {
    search?: string;
    rank?: string;
    unit?: string;
    medicalCleared?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'serialNumber' | 'lastName' | 'rank' | 'dateJoined';
    sortOrder?: 'asc' | 'desc';
}
//# sourceMappingURL=personnel.types.d.ts.map