/**
 * Asset & Resource Accountability Types
 */

export type AssetCategory =
  | 'Medical Equipment'
  | 'Vehicle'
  | 'Fleet Card'
  | 'Petty Cash / Funds';

export type AssetStatus =
  | 'Available'
  | 'Issued'
  | 'Returned'
  | 'Lost'
  | 'Under Maintenance';

export const ASSET_CATEGORIES: AssetCategory[] = [
  'Medical Equipment',
  'Vehicle',
  'Fleet Card',
  'Petty Cash / Funds',
];

export const ASSET_STATUSES: AssetStatus[] = [
  'Available',
  'Issued',
  'Returned',
  'Lost',
  'Under Maintenance',
];

export const ASSET_CONDITIONS = ['Good', 'Fair', 'Damaged'] as const;
export type AssetCondition = typeof ASSET_CONDITIONS[number];

/** True for physical items that can be issued/returned */
export const isPhysicalAsset = (category: AssetCategory): boolean =>
  category !== 'Petty Cash / Funds';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  referenceNumber: string; // serial no. / plate no. / card no. / fund ref
  description?: string;

  // Physical assets only (Medical Equipment, Vehicle, Fleet Card)
  status?: AssetStatus;
  issuedToId?: string;    // personnelId
  issuedToName?: string;  // "RANK Lastname, Firstname" (denormalized)
  issuedDate?: string;    // ISO date string
  expectedReturn?: string; // ISO date string
  returnedDate?: string;  // ISO date string
  condition?: string;

  // Petty Cash / Funds only
  amount?: number;
  purpose?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateAssetDTO {
  name: string;
  category: AssetCategory;
  referenceNumber: string;
  description?: string;
  status?: AssetStatus;
  condition?: string;
  amount?: number;
  purpose?: string;
}

export interface IssueAssetDTO {
  issuedToId: string;
  issuedToName: string;
  issuedDate: string;
  expectedReturn?: string;
}

export interface ReturnAssetDTO {
  returnedDate: string;
  condition: string;
}
