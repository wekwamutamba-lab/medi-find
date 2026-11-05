import {} from 'lucide-react';

export interface KPIMetricsProps {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

/**
 * KPIMetrics - Three high-level metric cards displayed across the top
 */
export function KPIMetrics({ totalItems, lowStockItems, outOfStockItems }: KPIMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Total Catalog Items Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3 9h2l3-9h-2l-3-9H10l-3 9H5l3 9H2l3-9H1zm8 12l-2-7h-2l-2 7h2l2-7zm-9-3a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Total Catalog Items</p>
        <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
      </div>

      {/* Low Stock Items Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.29 3.86l1.55-1.55c.39-.39 1.02-.39 1.41 0l1.55 1.55c.39.39.39 1.02 0 1.41l-1.55 1.55c-.39.39-1.02.39-1.41 0L7.73 6.95 5.86 8.82c-.39.39-.39 1.02 0 1.41l1.55 1.55c.39.39 1.02.39 1.41 0l1.55-1.55c.39-.39.39-1.02 0-1.41L10.29 3.86zM18 6l-3-3h2l-3 3H12l-3 3H9l3 3h2l3-3h3z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Low Stock Items</p>
        <p className="text-3xl font-bold text-slate-900">{lowStockItems}</p>
      </div>

      {/* Out of Stock Items Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 4.69V13c0 .66.54 1.2 1.2 1.2h3V7H1c-.66 0-1.2.54-1.2 1.2v8h2v-2.31l1.76-1.76c.38-.38.38-1.02 0-1.41l-1.41-1.41c-.38-.38-1.02-.38-1.41 0L2 4.69zM4 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-1 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM 9 5l1.41 1.41L5.83 10H19v2h-7.17l2.58 2.58L15 19l4-4H11l-1.41-1.41L9 11V5zm4 2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Out of Stock Items</p>
        <p className="text-3xl font-bold text-slate-900">{outOfStockItems}</p>
      </div>
    </div>
  );
}