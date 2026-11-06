import React, { useState } from 'react';

export interface AdjustmentFormValues {
  medicineId: string;
  batchNumber: string;
  adjustmentType: 'Correction (+)' | 'Disposal/Loss (-)';
  quantity: number;
  reason: string;
}

export function ManualStockAdjustmentModal({
  isOpen,
  onClose,
  onSubmit,
  medicines,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdjustmentFormValues) => void;
  medicines: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<AdjustmentFormValues>({
    medicineId: '',
    batchNumber: '',
    adjustmentType: 'Correction (+)',
    quantity: 1,
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record adjustment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md transform scale-95 origin-center animate-in fade-in-0 sm:scale-100"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Manual Stock Adjustment
        </h2>
        <p className="text-slate-500 mb-6">Record a manual stock adjustment for inventory</p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
            <p className="text-rose-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Select Medicine
            </label>
            <select
              name="medicineId"
              value={form.medicineId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            >
              <option value="">Select a medicine...</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Select Batch
            </label>
            <select
              name="batchNumber"
              value={form.batchNumber}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            >
              <option value="">Select a batch...</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Adjustment Type
            </label>
            <select
              name="adjustmentType"
              value={form.adjustmentType}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            >
              <option value="Correction (+)">Correction (+)</option>
              <option value="Disposal/Loss (-)">Disposal/Loss (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min={1}
                required
                className="w-24 rounded-lg border border-slate-200 p-1.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40"
              />
              <span className="text-slate-500">units</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Mandatory Reason
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
              placeholder="e.g., Damaged package during shelf audit"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-28 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-28 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Record Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}