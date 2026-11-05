import {} from 'lucide-react';

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

/**
 * StockStatusBadge - Visual indicator of medicine stock level
 */
export function StockStatusBadge({ status }: { status: MedicineStatus }) {
  const variants = {
    'in-stock': {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'In Stock',
    },
    'low-stock': {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      label: 'Low Stock',
      icon: 'Warning', // Will use text-amber-600 for icon
    },
    'out-of-stock': {
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      label: 'Out of Stock',
    },
  };

  const config = variants[status];
  return (
    <span
      className={
        `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`
      }
    >
      {config.label}
    </span>
  );
}