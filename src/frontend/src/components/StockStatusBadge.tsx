import { AlertTriangle, CheckCircle2, PackageOpen } from 'lucide-react';

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

export function StockStatusBadge({ status }: { status: MedicineStatus }) {
  const variants: Record<MedicineStatus, { bg: string; label: string; icon: typeof CheckCircle2 }> = {
    'in-stock': {
      bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      label: 'In Stock',
      icon: CheckCircle2,
    },
    'low-stock': {
      bg: 'bg-amber-100 text-amber-800 border border-amber-200',
      label: 'Low Stock',
      icon: AlertTriangle,
    },
    'out-of-stock': {
      bg: 'bg-rose-100 text-rose-800 border border-rose-200',
      label: 'Out of Stock',
      icon: PackageOpen,
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}