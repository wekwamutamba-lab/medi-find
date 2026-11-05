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

export type MovementType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'QUARANTINE';

export interface InventoryMovement {
  id: string;
  medicine_id: string;
  medicine_name: string;
  movement_type: MovementType;
  batch_number: string;
  quantity_change: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export interface MovementFilters {
  search: string;
  movement_type: MovementType | 'All';
  date_range: 'All Time' | 'Today' | 'Last 7 Days' | 'Last 30 Days';
}