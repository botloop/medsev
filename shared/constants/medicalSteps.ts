/**
 * Medical Processing Steps for PCG Personnel
 */

import type { MedicalStatus } from '../types/personnel.types';

export interface MedicalStepDefinition {
  step: number;
  title: string;
  description: string;
  requirements: string[];
}

export const MEDICAL_STEPS: MedicalStepDefinition[] = [
  {
    step: 1,
    title: 'Acquiring Routing Slip and Medical Referral',
    description: 'Must be taken at Medical Station EV. Soft copies are prohibited. Routing Slip must be filled up from 1st page to 3rd page. Proceed to accredited diagnostic medical laboratories.',
    requirements: [
      'Routing Slip (pages 1-3 filled)',
      'Medical Referral Form',
      'Visit to accredited diagnostic laboratory'
    ]
  },
  {
    step: 2,
    title: 'Medical Laboratory Exams',
    description: 'Complete all required medical laboratory examinations at the accredited facility.',
    requirements: [
      'Urinalysis',
      'Hematology',
      'Blood Chemistry',
      'Serology',
      'ECG',
      'Radiology (Chest X-Ray)',
      'Neurological Assessment'
    ]
  },
  {
    step: 3,
    title: 'Submission of Routing Slip and Medical Laboratory Results',
    description: 'Submit all documents to be evaluated by medical personnel. Documents can be scanned as follows:',
    requirements: [
      '1st page routing slip to Last Page',
      'Medical Certificate',
      'Drug Test Results',
      'Urinalysis',
      'Hematology',
      'Blood Chemistry',
      'Serology',
      'ECG',
      'Radiology',
      'Neurological Report'
    ]
  },
  {
    step: 4,
    title: 'Dental Referral',
    description: 'Claim Dental Referral form at Medical Station EV after initial medical evaluation.',
    requirements: [
      'Completed medical evaluation',
      'Routing Slip with medical clearance stamp',
      'Dental Referral Form from Medical Station EV'
    ]
  },
  {
    step: 5,
    title: 'Dental Processing',
    description: 'Complete dental examination and required treatments at the dental clinic.',
    requirements: [
      'Dental examination',
      'Dental X-Rays if required',
      'Completion of required dental treatments'
    ]
  },
  {
    step: 6,
    title: 'Submission of Routing Slip and Medical Lab Results',
    description: 'Submit all documents in hard copy format on a white long folder to the medical station.',
    requirements: [
      'Complete Routing Slip',
      'All medical laboratory results',
      'Dental clearance',
      'Documents in white long folder (hard copy only)'
    ]
  },
  {
    step: 7,
    title: 'Medical Clearance',
    description: 'Final evaluation by the senior medical officer for medical clearance approval.',
    requirements: [
      'Complete documentation',
      'Pass final medical evaluation',
      'Approval by senior medical officer'
    ]
  },
  {
    step: 8,
    title: 'Done',
    description: 'Medical processing complete. Personnel is medically cleared for service.',
    requirements: [
      'Releasing of Medical Clearance',
      'Updated medical records in personnel file'
    ]
  }
];

export function getMedicalStepByNumber(stepNumber: number): MedicalStepDefinition | undefined {
  return MEDICAL_STEPS.find(step => step.step === stepNumber);
}

export function calculateMedicalProgress(medicalStatus: MedicalStatus): number {
  const steps = [
    medicalStatus.step1,
    medicalStatus.step2,
    medicalStatus.step3,
    medicalStatus.step4,
    medicalStatus.step5,
    medicalStatus.step6,
    medicalStatus.step7,
    medicalStatus.step8
  ];

  const completedSteps = steps.filter(step => step.completed).length;

  return (completedSteps / 8) * 100;
}
