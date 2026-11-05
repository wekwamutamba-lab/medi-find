import {} from 'lucide-react';

export interface KPIMovementsProps {
  totalTransactions: number;
  stockReceived: number;
  stockIssued: number;
  disposalAdjustments: number;
}

/**
 * KPIMovements - Four high-level audit summary cards across the top
 */
export function KPIMovements({ totalTransactions, stockReceived, stockIssued, disposalAdjustments }: KPIMovementsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Transactions Card */}
      <div
        className="
          rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow
          border-t-4 bg-slate-50
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3 9h2l3-9h-2l-3-9H10l-3 9H5l3 9H2l3-9H1zm8 12l-2-7h-2l-2 7h2l2-7zm-9-3a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Total Transactions</p>
        <p className="text-3xl font-bold text-slate-900">{totalTransactions}</p>
      </div>

      {/* Stock Received Card */}
      <div
        className="
          rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow
          border-t-4 bg-emerald-50
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-2v-5h2c0 1.1.89 2 2 2zm-7-13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-5c-.5-1.2-1.1-2-2-2s-1.5.8-2 2c.5 1.3 1.1 2 2 2s2-1.7 2-2zm7 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-2 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-6-5a2 2 0 1 1 0-4 2 2 0 0 0 0 4zm8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-3-8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Stock Received (30 Days)</p>
        <p className="text-3xl font-bold text-emerald-800">{stockReceived}</p>
      </div>

      {/* Stock Issued Card */}
      <div
        className="
          rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow
          border-t-4 bg-blue-50
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v3.5l-1 1L5 21v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7.5l-1-1L19 7v3.5a2.5 2.5 0 0 1 0 5L17.5 19l1.5 1.5a2.5 2.5 0 0 1-3.5 3.5L11 21l2.5-2.5a2.5 2.5 0 0 1 3.5-3.5L15 15l5.5 5.5a2.5 2.5 0 0 1-3.5 3.5L19 19l1.5-1.5a2.5 2.5 0 0 1-3.5-3.5L13 11l4.5-4.5a2.5 2.5 0 0 1 3.5-3.5L19 7zM15 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Stock Issued (30 Days)</p>
        <p className="text-3xl font-bold text-blue-800">{stockIssued}</p>
      </div>

      {/* Disposal & Adjustments Card */}
      <div
        className="
          rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow
          border-t-4 bg-amber-50
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2v3h2a2 2 0 0 1 2 2v5h-2v5a2 2 0 0 1-2 2h-5v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-5H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h2V5a2 2 0 0 1 2-2h3zM2 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3H2V7zM5 18a2 2 0 0 1-2-2h-2a2 2 0 0 1-2 2v3h3v-3H5zm6.5-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3h-3v-3h-2v3a1 1 0 0 1-1 1h-3v-3zM9 10a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h-3v-3H9zm6.5 4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h-3v-3h-2v3a1 1 0 0 1-1 1h-3v-3z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-slate-500">Disposal & Adjustments</p>
        <p className="text-3xl font-bold text-amber-800">{disposalAdjustments}</p>
      </div>
    </div>
  );
}