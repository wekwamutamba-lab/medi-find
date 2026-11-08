import React, { useEffect, useState } from 'react';

export type MedicineFormValues = {
  name: string;
  strength: string;
  dosage_form: string;
  pack_size: number;
  category: string;
  reorder_level: number;
  unit_price: number;
  notes: string;
};

/**
 * AddMedicineModal - Modal form for adding a new medicine to the catalog
 */
export function AddMedicineModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  title = 'Add Medicine to Catalog',
  submitLabel = 'Add Medicine',
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicineFormValues) => Promise<void> | void;
  initialValues?: MedicineFormValues;
  title?: string;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<MedicineFormValues>({
    name: '',
    strength: '',
    dosage_form: 'Tablet',
    pack_size: 30,
    category: 'Other',
    reorder_level: 10,
    unit_price: 0,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(initialValues ?? { name: '', strength: '', dosage_form: 'Tablet', pack_size: 30, category: 'Other', reorder_level: 10, unit_price: 0, notes: '' });
  }, [isOpen, initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: ['pack_size', 'reorder_level', 'unit_price'].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSubmit(form);
      setForm({ name: '', strength: '', dosage_form: 'Tablet', pack_size: 30, category: 'Other', reorder_level: 10, unit_price: 0, notes: '' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add medicine');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-medicine-title"
        className="my-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h2 id="add-medicine-title" className="mb-2 text-xl font-bold text-slate-900">{title}</h2>
        <p className="mb-6 text-sm text-slate-500">Enter the medicine details for this pharmacy catalog.</p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
            <p className="text-rose-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
              placeholder="e.g., Paracetamol"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Strength</label>
            <input type="text" name="strength" value={form.strength} onChange={handleChange} required maxLength={100} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="e.g., 500 mg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Dosage form</label>
            <select name="dosage_form" value={form.dosage_form} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm">
              <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Inhaler</option><option>Injection</option><option>Cream</option><option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Pack size</label>
            <input type="number" name="pack_size" min="1" step="1" value={form.pack_size} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40 placeholder-slate-400"
            >
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
                name="reorder_level"
                value={form.reorder_level}
                onChange={handleChange}
                min={0}
                required
                className="w-full rounded-lg border border-slate-200 p-1.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40"
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
                className="w-full rounded-lg border border-slate-200 p-1.5 text-sm focus-ring:outline-none focus-ring:ring-2 focus:ring-slate-300 focus:ring-opacity-40"
              />
              <span className="text-sm text-slate-500">$/unit</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Notes (optional)</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} maxLength={1000} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="Additional catalog details" />
          </div>

          <div className="flex justify-end gap-3 pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="w-28 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-28 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              {saving ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}