export type MedicineStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface InventoryItem {
  id: string;
  name: string;
  strength: string;
  dosage_form: string;
  pack_size: number;
  category: string;
  reorder_level: number;
  usable_stock: number;
  unit_price: number;
  status: MedicineStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}