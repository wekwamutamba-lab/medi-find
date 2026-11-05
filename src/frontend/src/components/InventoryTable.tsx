import {} from 'lucide-react';

export interface InventoryTableProps {
  items: any[];
  columns?: {
    name?: string;
    category?: string;
    reorder_threshold?: string;
    current_stock?: string;
    unit_price?: string;
    stock_status?: string;
    actions?: string;
  };
}

/**
 * InventoryTable - Master inventory table displaying medicine metadata and stock levels
 */
export function InventoryTable({ items, columns = {} }: InventoryTableProps) {
  // Category color mapping
  const categoryColors: Record<string, string> = {
    Analgesics: 'blue',
    Antibiotics: 'green',
    Antihistamines: 'purple',
    Antidiabetics: 'orange',
    Gastric: 'teal',
    Respiratory: 'amber',
    'All Categories': 'slate',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full rounded-xl border border-slate-200">
        <thead>
          <tr role="row">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Medicine Name & Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reorder Threshold
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Current Stock Level
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Stock Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item) => {
              const status =
                item.usable_stock === 0
                  ? 'out-of-stock'
                  : item.usable_stock < item.reorder_level
                  ? 'low-stock'
                  : 'in-stock';

              return (
                <tr
                  key={item.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td
                    className="px-6 py-4 font-medium text-slate-900"
                    role="gridcell"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Pill size={14} />
                      </span>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="text-xs text-slate-400">
                          {item.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={
                        `inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${
                          categoryColors[item.category] || 'slate'
                        }-bg`
                      }
                    >
                      {item.category}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{item.reorder_level} units</span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">
                      {item.usable_stock}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">${item.unit_price.toFixed(2)}</span>
                  </td>

                  <td className="px-6 py-4">
                    <StockStatusBadge status={status} />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Edit threshold for {item.name}"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Threshold
                      </button>

                      <button
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="View batches for {item.name}"
                      >
                        <Eye className="w-3 h-3" />
                        View Batches
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                No items match the current filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}