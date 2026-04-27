/**
 * Medical Supplies Types
 * Shared between client and server
 */

export const SUPPLY_CATEGORIES = [
  'Medications',
  'Bandages & Dressings',
  'IV & Fluids',
  'PPE',
  'Instruments & Equipment',
  'Consumables',
  'Emergency Supplies',
  'Other',
] as const;

export type SupplyCategory = typeof SUPPLY_CATEGORIES[number];

export const SUPPLY_UNITS = ['pcs', 'boxes', 'bottles', 'ampules', 'vials', 'sachets', 'pairs', 'sets', 'rolls', 'packs', 'liters', 'ml'] as const;
export type SupplyUnit = typeof SUPPLY_UNITS[number];

export interface MedicalSupply {
  id: string;
  name: string;
  category: SupplyCategory | string;
  quantity: number;
  unit: SupplyUnit | string;
  minimumStock: number;
  expiryDate?: string;    // ISO date string YYYY-MM-DD
  location?: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateMedicalSupplyDTO {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  expiryDate?: string;
  location?: string;
  supplier?: string;
  notes?: string;
}

export interface UpdateMedicalSupplyDTO extends Partial<CreateMedicalSupplyDTO> {
  id: string;
}
