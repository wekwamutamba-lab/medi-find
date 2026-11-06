import { Plus, Search, Truck } from 'lucide-react';

export type CategoryFilter =
  | 'All Categories'
  | 'Analgesics'
  | 'Antibiotics'
  | 'Antihistamines'
  | 'Antidiabetics'
  | 'Gastric'
  | 'Respiratory';

export interface ControlsBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (filter: CategoryFilter) => void;
  stockFilter: 'all' | 'low' | 'out';
  setStockFilter: (filter: 'all' | 'low' | 'out') => void;
  onAddMedicine: () => void;
  onReceiveStock: () => void;
}

export function ControlsBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  onAddMedicine,
  onReceiveStock,
}: ControlsBarProps) {
  const categories: CategoryFilter[] = [
    'All Categories',
    'Analgesics',
    'Antibiotics',
    'Antihistamines',
    'Antidiabetics',
    'Gastric',
    'Respiratory',
  ];

  return (
    <div className="border-b border-slate-200 bg-white rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex-1 flex gap-2 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 rounded-lg border border-slate-200 h-10 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40"
          />
        </div>
      </div>

      <div className="relative flex sm:ml-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className="rounded-lg border border-slate-200 bg-white h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex sm:ml-4">
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
          className="rounded-lg border border-slate-200 bg-white h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-40 cursor-pointer"
        >
          <option value="all">All Items</option>
          <option value="low">Low Stock Only</option>
          <option value="out">Out of Stock Only</option>
        </select>
      </div>

      <div className="flex gap-2 sm:ml-auto">
        <button
          onClick={onAddMedicine}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          + Add New Medicine
        </button>

        <button
          onClick={onReceiveStock}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors text-white"
        >
          <Truck className="w-4 h-4" />
          Receive Stock
        </button>
      </div>
    </div>
  );
}