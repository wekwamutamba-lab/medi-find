import {} from 'lucide-react';

export type MovementType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'QUARANTINE';

export interface MovementStatusBadgeProps {
  movementType: MovementType;
}

/**
 * MovementStatusBadge - Visual badge for movement type
 */
export function MovementStatusBadge({ movementType }: MovementStatusBadgeProps) {
  const variants = {
    RECEIPT {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: 'ArrowDownLeft', // lucide icon name
      label: 'Receipt',
    },
    ISSUE {
      bg: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'ArrowUpRight',
      label: 'Issued',
    },
    ADJUSTMENT {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: 'Edit',
      label: 'Adjustment',
    },
    QUARANTINE {
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: 'AlertCircle',
      label: 'Quarantine',
    },
  };

  const config = variants[movementType];
  return (
    <span
      className={
        `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`
      }
    >
      <>{config.icon ? <>{config.icon}</> : ""}</>
      {config.label}
    </span>
  );
}