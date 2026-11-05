import {} from 'lucide-react';

export interface MovementsControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  movementTypeFilter: 'All' | 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'QUARANTINE';
  setMovementTypeFilter: (filter: 'All' | 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'QUARANTINE') => void;
  dateFilter: 'All Time' | 'Today' | 'Last 7 Days' | 'Last 30 Days';
  setDateFilter: (filter: 'All Time' | 'Today' | 'Last 7 Days' | 'Last 30 Days') => void;
  onExportCsv: () => void;
}

/**
 * MovementsControls - Search, filter, and export bar above the audit ledger
 */
export function MovementsControls({
  searchQuery,
  setSearchQuery,
  movementTypeFilter,
  setMovementTypeFilter,
  dateFilter,
  setDateFilter,
  onExportCsv,
}: MovementsControlsProps) {
  const movementTypes = [
    { value: 'All', label: 'All Movements' },
    { value: 'RECEIPT', label: 'Receipts' },
    { value: 'ISSUE', label: 'Issues' },
    { value: 'ADJUSTMENT', label: 'Adjustments' },
    { value: 'QUARANTINE', label: 'Quarantine' },
  ];

  const dateRanges = [
    { value: 'All Time', label: 'All Time' },
    { value: 'Today', label: 'Today' },
    { value: 'Last 7 Days', label: 'Last 7 Days' },
    { value: 'Last 30 Days', label: 'Last 30 Days' },
  ];

  return (
    <div className="border-b border-slate-200 bg-white rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search Input */}
        <div className="flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by medicine name, batch number, reason, or staff ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 rounded-lg border border-slate-200 h-10 px-12 text-sm focus-ring:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
          />
        </div>

        {/* Movement Type Filter */}
        <div className="relative sm:ml-4">
          <select
            value={movementTypeFilter}
            onChange={(e) => setMovementTypeFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white h-10 px-3 text-sm focus-ring:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 cursor-pointer"
          >
            {movementTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="relative sm:ml-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white h-10 px-3 text-sm focus-ring:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 cursor-pointer"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <div className="relative sm:ml-4">
          <button
            onClick={onExportCsv}
            className="
              rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors
            "
            aria-label="Export Audit Log CSV"
          >
            <Download className="w-4 h-4" /> Export Audit Log (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}