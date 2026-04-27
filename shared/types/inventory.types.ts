export type InventoryCategory = 'Medicine' | 'Equipment' | 'Supplies' | 'PPE' | 'Other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  stockCount: number;
  unit: string;
  expirationDate?: string;
  qrCode: string;
  location?: string;
  minimumStock: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateInventoryDTO {
  name: string;
  category: InventoryCategory;
  stockCount: number;
  unit: string;
  expirationDate?: string;
  qrCode: string;
  location?: string;
  minimumStock: number;
  notes?: string;
}

export type UpdateInventoryDTO = Partial<CreateInventoryDTO>;
