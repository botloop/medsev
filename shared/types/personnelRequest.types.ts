/**
 * Personnel Request Types
 * Viewer-submitted profile requests pending admin approval
 */

export type PersonnelRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PersonnelRequestData {
  serialNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthdate: string;
  rank: string;
  unit: string;
  dateJoined: string;
  gender?: string;
  bloodType?: string;
  contactNumber?: string;
  email?: string;
  permanentAddress?: string;
  designation?: string;
  ete?: string;
  reEnlistmentStatus?: string;
  cadProgram?: string;
  processType?: string;
}

export interface PersonnelRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: PersonnelRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  personnelId?: string;
  data: PersonnelRequestData;
}

export interface CreatePersonnelRequestDTO {
  data: PersonnelRequestData;
}
