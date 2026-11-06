import { AlertTriangle, ArrowDownLeft, ArrowUpRight, PencilLine } from 'lucide-react';

export type MovementType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'QUARANTINE';

export interface MovementStatusBadgeProps {
  movementType: MovementType;
}

export function MovementStatusBadge({ movementType }: MovementStatusBadgeProps) {
  const variants: Record<MovementType, { bg: string; icon: typeof ArrowDownLeft; label: string }> = {
    RECEIPT: {
      bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      icon: ArrowDownLeft,
      label: 'Receipt',
    },
    ISSUE: {
      bg: 'bg-blue-100 text-blue-800 border border-blue-200',
      icon: ArrowUpRight,
      label: 'Issued',
    },
    ADJUSTMENT: {
      bg: 'bg-amber-100 text-amber-800 border border-amber-200',
      icon: PencilLine,
      label: 'Adjustment',
    },
    QUARANTINE: {
      bg: 'bg-rose-100 text-rose-800 border border-rose-200',
      icon: AlertTriangle,
      label: 'Quarantine',
    },
  };

  const config = variants[movementType];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}