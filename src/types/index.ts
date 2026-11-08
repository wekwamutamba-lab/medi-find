export type Role = 'admin' | 'pharmacist' | 'staff';

export interface Profile {
  id: string;
  pharmacy_id: string;
  full_name: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  dosage_form: string;
  pack_size: number;
  category: string;
  reorder_level: number;
  unit_price: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  medicine_id: string;
  batch_number: string;
  manufacturing_date?: string | null;
  expiry_date: string;
  quantity_packs: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  batch_id: string;
  movement_type: 'receipt' | 'issue' | 'adjustment';
  quantity_packs: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface AlertSettings {
  id: number;
  expiry_warning_days: number;
  updated_at: string;
  updated_by: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  pharmacy_id: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
