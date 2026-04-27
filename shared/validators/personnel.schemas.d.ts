/**
 * Personnel Validation Schemas
 * Zod schemas for validating personnel data
 */
import { z } from 'zod';
export declare const medicalStatusSchema: z.ZodObject<{
    step1: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step2: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step3: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step4: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step5: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step6: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step7: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    step8: z.ZodObject<{
        completed: z.ZodBoolean;
        date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }, {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    }>;
    cleared: z.ZodBoolean;
    clearedDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    step1: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step2: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step3: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step4: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step5: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step6: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step7: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step8: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    cleared: boolean;
    clearedDate?: string | null | undefined;
}, {
    step1: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step2: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step3: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step4: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step5: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step6: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step7: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    step8: {
        completed: boolean;
        date?: string | null | undefined;
        notes?: string | undefined;
    };
    cleared: boolean;
    clearedDate?: string | null | undefined;
}>;
export declare const createPersonnelSchema: z.ZodObject<{
    serialNumber: z.ZodString;
    firstName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodString;
    birthdate: z.ZodEffects<z.ZodString, string, string>;
    rank: z.ZodEnum<z.Writeable<any>>;
    unit: z.ZodString;
    contactNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    dateJoined: z.ZodString;
    ete: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    reEnlistmentStatus: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    cadProgram: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    medicalSteps: z.ZodOptional<z.ZodObject<{
        step1: z.ZodOptional<z.ZodBoolean>;
        step2: z.ZodOptional<z.ZodBoolean>;
        step3: z.ZodOptional<z.ZodBoolean>;
        step4: z.ZodOptional<z.ZodBoolean>;
        step5: z.ZodOptional<z.ZodBoolean>;
        step6: z.ZodOptional<z.ZodBoolean>;
        step7: z.ZodOptional<z.ZodBoolean>;
        step8: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    }, {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    serialNumber: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    unit: string;
    dateJoined: string;
    middleName?: string | undefined;
    rank?: any;
    contactNumber?: string | undefined;
    email?: string | undefined;
    ete?: string | undefined;
    reEnlistmentStatus?: string | undefined;
    cadProgram?: string | undefined;
    medicalSteps?: {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    } | undefined;
}, {
    serialNumber: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    unit: string;
    dateJoined: string;
    middleName?: string | undefined;
    rank?: any;
    contactNumber?: string | undefined;
    email?: string | undefined;
    ete?: string | undefined;
    reEnlistmentStatus?: string | undefined;
    cadProgram?: string | undefined;
    medicalSteps?: {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    } | undefined;
}>;
export declare const updatePersonnelSchema: z.ZodObject<{
    serialNumber: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    middleName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodString>;
    birthdate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    rank: z.ZodOptional<z.ZodEnum<z.Writeable<any>>>;
    unit: z.ZodOptional<z.ZodString>;
    contactNumber: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    dateJoined: z.ZodOptional<z.ZodString>;
    ete: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    reEnlistmentStatus: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    cadProgram: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    medicalSteps: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        step1: z.ZodOptional<z.ZodBoolean>;
        step2: z.ZodOptional<z.ZodBoolean>;
        step3: z.ZodOptional<z.ZodBoolean>;
        step4: z.ZodOptional<z.ZodBoolean>;
        step5: z.ZodOptional<z.ZodBoolean>;
        step6: z.ZodOptional<z.ZodBoolean>;
        step7: z.ZodOptional<z.ZodBoolean>;
        step8: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    }, {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    serialNumber?: string | undefined;
    firstName?: string | undefined;
    middleName?: string | undefined;
    lastName?: string | undefined;
    birthdate?: string | undefined;
    rank?: any;
    unit?: string | undefined;
    contactNumber?: string | undefined;
    email?: string | undefined;
    dateJoined?: string | undefined;
    ete?: string | undefined;
    reEnlistmentStatus?: string | undefined;
    cadProgram?: string | undefined;
    medicalSteps?: {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    } | undefined;
}, {
    serialNumber?: string | undefined;
    firstName?: string | undefined;
    middleName?: string | undefined;
    lastName?: string | undefined;
    birthdate?: string | undefined;
    rank?: any;
    unit?: string | undefined;
    contactNumber?: string | undefined;
    email?: string | undefined;
    dateJoined?: string | undefined;
    ete?: string | undefined;
    reEnlistmentStatus?: string | undefined;
    cadProgram?: string | undefined;
    medicalSteps?: {
        step1?: boolean | undefined;
        step2?: boolean | undefined;
        step3?: boolean | undefined;
        step4?: boolean | undefined;
        step5?: boolean | undefined;
        step6?: boolean | undefined;
        step7?: boolean | undefined;
        step8?: boolean | undefined;
    } | undefined;
}>;
export declare const personnelFilterSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    rank: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    medicalCleared: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodEnum<["serialNumber", "lastName", "rank", "dateJoined"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    rank?: string | undefined;
    unit?: string | undefined;
    medicalCleared?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "serialNumber" | "lastName" | "rank" | "dateJoined" | undefined;
    sortOrder?: "desc" | "asc" | undefined;
}, {
    search?: string | undefined;
    rank?: string | undefined;
    unit?: string | undefined;
    medicalCleared?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "serialNumber" | "lastName" | "rank" | "dateJoined" | undefined;
    sortOrder?: "desc" | "asc" | undefined;
}>;
export declare const updateMedicalStatusSchema: z.ZodObject<{
    step: z.ZodNumber;
    completed: z.ZodBoolean;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    step: number;
    completed: boolean;
    notes?: string | undefined;
}, {
    step: number;
    completed: boolean;
    notes?: string | undefined;
}>;
export type CreatePersonnelInput = z.infer<typeof createPersonnelSchema>;
export type UpdatePersonnelInput = z.infer<typeof updatePersonnelSchema>;
export type PersonnelFilterInput = z.infer<typeof personnelFilterSchema>;
export type UpdateMedicalStatusInput = z.infer<typeof updateMedicalStatusSchema>;
//# sourceMappingURL=personnel.schemas.d.ts.map