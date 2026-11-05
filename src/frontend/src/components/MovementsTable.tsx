import {} from 'lucide-react';

export interface MovementsTableProps {
  movements: any[];
}

/**
 * MovementsTable - Audit ledger table displaying chronological stock movement log
 */
export function MovementsTable({ movements }: MovementsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full rounded-xl border border-slate-200">
        <thead>
          <tr role="row">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style={{ width: '120px' }}>
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style={{ width: '180px' }}>
              Medicine & Form
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Batch / Lot #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style={{ width: '120px' }}>
              Movement Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style={{ width: '130px' }}>
              Quantity Change
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style={{ width: '280px' }}>
              Reason / Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style={{ width: '150px' }}>
              Logged By
            </th>
          </tr>
        </thead>
        <tbody>
          {movements.length ? (
            movements.map((item) => {
              const type = item.movement_type;
              const quantityClass = type === 'ISSUE' ? 'text-rose-600' : type === 'RECEIPT' ? 'text-emerald-600' : 'text-amber-600';
              const quantitySign = type === 'ISSUE' ? '-' : type === 'RECEIPT' ? '+' : '';
              
              // Format timestamp
              const date = new Date(item.created_at);
              const formattedDate = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

              return (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900" style={{ whiteSpace: 'nowrap' }} role="gridcell">
                    {formattedDate}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900" style={{ whiteSpace: 'nowrap' }}>
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <>{item.movement_type === 'RECEIPT' ? <Pill size={12} /> : ""}</>
                    </span>
                    <span>{item.medicine_name}</span>
                    <small className="text-slate-400">{item.movement_type === 'ISSUE' ? '' : item.movement_type === 'RECEIPT' ? '' : ""}</small>
                  </td>

                  <td className="px-6 py-4">
                    <code className="font-mono text-sm text-slate-500 break-all">{item.batch_number}</code>
                  </td>

                  <td className="px-6 py-4">
                    <MovementStatusBadge movementType={item.movement_type as any} />
                  </td>

                  <td className="px-6 py-4">
                    <span className={`font-medium ${quantityClass}`}>
                      {quantitySign}{item.quantity_change} Packs
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <small className="text-slate-500 break-all">{item.reason}</small>
                  </td>

                  <td className="px-6 py-4">
                    <small className="text-slate-500">{item.performed_by}</small>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                <div className="empty-state">
                  <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="3" x2="9" y2="3" />
                    <line x1="9" y1="21" x2="15" y2="21" />
                  </svg>
                  <p>No audit log entries match the current filters</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}