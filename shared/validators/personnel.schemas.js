/**
 * Personnel Validation Schemas
 * Zod schemas for validating personnel data
 */
import { z } from 'zod';
import { ALL_RANKS } from '../constants/ranks.js';
// Medical Step Schema
const medicalStepSchema = z.object({
    completed: z.boolean(),
    date: z.string().datetime().optional().nullable(),
    notes: z.string().optional()
});
// Medical Status Schema
export const medicalStatusSchema = z.object({
    step1: medicalStepSchema,
    step2: medicalStepSchema,
    step3: medicalStepSchema,
    step4: medicalStepSchema,
    step5: medicalStepSchema,
    step6: medicalStepSchema,
    step7: medicalStepSchema,
    step8: medicalStepSchema,
    cleared: z.boolean(),
    clearedDate: z.string().datetime().optional().nullable()
});
// Create Personnel Schema
export const createPersonnelSchema = z.object({
    serialNumber: z
        .string()
        .min(1, 'Serial number is required')
        .max(20, 'Serial number too long')
        .regex(/^[A-Z0-9-]+$/, 'Serial number must contain only uppercase letters, numbers, and hyphens'),
    firstName: z.string().min(1, 'First name is required').max(100),
    middleName: z.string().max(100).optional(),
    lastName: z.string().min(1, 'Last name is required').max(100),
    birthdate: z.string().min(1, 'Birthdate is required').refine((dateStr) => {
        const birthDate = new Date(dateStr);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        // Calculate exact age
        const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        return exactAge >= 18;
    }, 'Must be at least 18 years old'),
    rank: z.enum(ALL_RANKS, { errorMap: () => ({ message: 'Invalid rank' }) }),
    unit: z.string().min(1, 'Unit is required').max(200),
    contactNumber: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    dateJoined: z.string().min(1, 'Date joined is required'),
    ete: z.string().optional().or(z.literal('')),
    reEnlistmentStatus: z.string().max(100).optional().or(z.literal('')),
    cadProgram: z.string().max(200).optional().or(z.literal('')),
    medicalSteps: z.object({
        step1: z.boolean().optional(),
        step2: z.boolean().optional(),
        step3: z.boolean().optional(),
        step4: z.boolean().optional(),
        step5: z.boolean().optional(),
        step6: z.boolean().optional(),
        step7: z.boolean().optional(),
        step8: z.boolean().optional()
    }).optional()
});
// Update Personnel Schema (all fields optional except serialNumber for uniqueness check)
export const updatePersonnelSchema = createPersonnelSchema.partial();
// Query/Filter Schema
export const personnelFilterSchema = z.object({
    search: z.string().optional(),
    rank: z.string().optional(),
    unit: z.string().optional(),
    medicalCleared: z.boolean().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(1000).optional(),
    sortBy: z.enum(['serialNumber', 'lastName', 'rank', 'dateJoined']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});
// Medical Status Update Schema
export const updateMedicalStatusSchema = z.object({
    step: z.number().int().min(1).max(8),
    completed: z.boolean(),
    notes: z.string().optional()
});
//# sourceMappingURL=personnel.schemas.js.map