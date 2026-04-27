/**
 * PCR (Patient Care Report) Types
 * For emergency accidents/incidents - civilians and CG personnel
 */

export interface PCRVitalSign {
  time: string;
  bp: string;
  pr: string;
  rr: string;
  temp: string;
  spo2: string;
  gcs: string;
}

export type PCRCaseType = 'trauma' | 'medical' | 'activity' | 'others';
export type PCRGender = 'M' | 'F';
export type PCRStatus = 'S' | 'M' | 'W';
export type PCRPatientType = 'civilian' | 'cg-personnel';
export type PCRDisposition =
  | 'transported-hospital'
  | 'released-treatment'
  | 'released-no-treatment'
  | 'endorsed-ems'
  | 'transported-other';

export const PCR_TRAUMA_FINDINGS = [
  'Deformity', 'Contusion', 'Abrasion', 'Avulsion', 'Puncture',
  'Burn', 'Tenderness', 'Laceration', 'Swelling',
  'Alcohol', 'Intoxication', 'Animal Bite', 'Drowning',
  'Electrocution', 'Fall', 'Gunshot Wound(s)', 'Hit and Run',
  'Mauling', 'Stab Wound(s)', 'Vehicular Accident', 'Trauma of Other Cause',
] as const;

export const PCR_SERVICES_RENDERED = [
  'Artificial Airway', 'Abdominal Thrust', 'Bandaging', 'Bleeding Control',
  'BP Monitoring', 'Burn Care', 'Cervical Collar', 'Cardiac Monitoring',
  'Cleaning of Wounds', 'Cold Application', 'CPR', 'Defibrillation',
  'Irrigation of Water', 'Rescue Breathing', 'Pulse Oximetry', 'Suctioning',
  'Splinting / Traction', 'Oxygenation', 'BVM', 'Mask', 'Neb',
  'V.A.P.E', 'Assisted on Meds', 'Spine Immobilization', 'VS Check', 'Others',
] as const;

export const PCR_BURN_DEGREES = ['1st Degree', '2nd Degree', '3rd Degree'] as const;
export const PCR_MUSCULOSKELETAL = ['Closed Fracture', 'Open Fracture', 'Sprain / Strain', 'Dislocation'] as const;

export interface PCRRecord {
  id: string;

  // Case / Incident Info
  caseNumber: string;
  date: string;           // ISO date
  timeOfCall: string;     // HH:mm
  timePeriod: 'AM' | 'PM';
  location: string;
  etdBase?: string;
  etaScene?: string;
  etdScene?: string;
  etaBase?: string;
  unit: string;
  teamLeader: string;
  teamOfficer: string;
  medics: string;

  // Patient
  patientType: PCRPatientType;
  patientName: string;
  contactNumber: string;
  age: string;
  gender: PCRGender | '';
  civilStatus: PCRStatus | '';
  address: string;
  dateOfBirth: string;
  religion: string;
  informantGuardian: string;

  // Case type
  caseType: PCRCaseType | '';

  // Chief Complaint
  chiefComplaint: string;

  // SAMPLE History
  symptoms: string;
  allergies: string;
  medications: string;
  pertinentHistory: string;
  lastOralIntake: string;
  eventsLeading: string;

  // Physical Assessment
  moisture: 'normal' | 'dry' | 'moist' | '';
  temperature: 'normal' | 'warm' | 'cool' | '';
  skinColor: 'normal' | 'yellowish' | 'pale' | 'bluish' | 'reddish' | '';
  pupil: 'pearl' | 'constricted' | 'dilated' | 'unequal' | '';
  capillaryRefill: 'normal' | 'delayed' | 'none' | '';
  responsiveness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | '';

  // Trauma findings (checkboxes)
  traumaFindings: string[];

  // Vital Signs
  vitalSigns: PCRVitalSign[];

  // Burn & Musculoskeletal
  burnLocations: string[];    // body regions (Rule of Nines)
  burnSurfaceArea: string;    // estimated total burn surface area %
  burnDegrees: string[];
  musculoskeletal: string[];

  // Services Rendered
  disposition: PCRDisposition | '';
  dispositionOther?: string;
  servicesRendered: string[];

  // Hospital Conduction
  hospitalName: string;
  hospitalAddress: string;
  department: string;
  advanceCalledBy: string;
  callReceivedBy: string;
  physicianOnDuty: string;
  accomplishedBy: string;
  notedBy: string;

  // Release from Responsibility
  refusedTreatment: boolean;
  refusedTransport: boolean;
  refusedServices: boolean;
  refusalRepresentativeOf: string;       // "on behalf of myself/the person I represent: ___"
  refusalPatientName: string;
  refusalRepresentativeName: string;
  refusalAge: string;
  refusalRelationship: string;
  refusalDateTime: string;               // date/time of patient/rep signature
  refusalContactNumber: string;
  refusalWitnessName: string;
  refusalWitnessAge: string;
  refusalWitnessRelationship: string;
  refusalWitnessDateTime: string;        // date/time of witness signature
  refusalWitnessContact: string;

  // Patient Valuables & Notes
  patientValuables: string;
  notes: string;

  // Narrative Report (DCHARxTE)
  narrativeD: string;   // Dispatch
  narrativeC: string;   // Chief Complaint
  narrativeHx: string;  // History
  narrativeA: string;   // Assessment
  narrativeRx: string;  // Treatment
  narrativeT: string;   // Transport
  narrativeE: string;   // Exceptions

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
}

export interface CreatePCRDTO extends Omit<PCRRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'> {}
export interface UpdatePCRDTO extends Partial<CreatePCRDTO> {}
