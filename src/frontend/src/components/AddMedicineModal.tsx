import React, { useState } from 'react';

export type MedicineFormValues = {
  name: string;
  category: string;
  reorder_threshold: number;
  unit_price: number;
};

/**
 * AddMedicineModal - Modal form for adding a new medicine to the catalog
 */
export function AddMedicineModal({
  isOpen,
  onClose,
  onSubmit}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicineFormValues) => void;
}) {
  const [form, setForm] = useState<MedicineFormValues>({
    name: '',
    category: '',
    reorder_threshold: 10,
    unit_price: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'reorder_threshold' || name === 'unit_price' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add medicine');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div
        className="
          bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md
          transform scale-95 origin-center animate-in fade-in-0 sm:scale-100
        "
      >
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Add New Medicine
        </h2>
        <p className="text-slate-500 mb-6">Register a new medicine in the catalog</p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
            <p className="text-rose-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Medicine Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
              placeholder="e.g., Paracetamol 500mg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            >
              <option value="">Select category...</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Antihistamines">Antihistamines</option>
              <option value="Antidiabetics">Antidiabetics</option>
              <option value="Gastric">Gastric</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Reorder Threshold Level
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="reorder_threshold"
                value={form.reorder_threshold}
                onChange={handleChange}
                min={1}
                required
                className="w-24 rounded-lg border border-slate-200 p-1.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40"
              />
              <span className="text-sm text-slate-500">units</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Unit Price
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="unit_price"
                value={form.unit_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-24 rounded-lg border border-slate-200 p-1.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40"
              />
              <span className="text-sm text-slate-500">$/unit</span>
            </div>
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
              Add Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}