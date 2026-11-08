import { useEffect, useState, type FormEvent } from 'react';
import type { Medicine } from '../api';

export interface ReceiveStockValues {
  medicine_id: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date: string;
  quantity_packs: number;
  unit_cost: number;
}

interface ReceiveStockModalProps {
  isOpen: boolean;
  medicines: Medicine[];
  onClose: () => void;
  onSubmit: (values: ReceiveStockValues) => Promise<void>;
}

export function ReceiveStockModal({ isOpen, medicines, onClose, onSubmit }: ReceiveStockModalProps) {
  const [form, setForm] = useState<ReceiveStockValues>({
    medicine_id: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    quantity_packs: 1,
    unit_cost: 0,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm((current) => ({ ...current, medicine_id: current.medicine_id || medicines[0]?.id || '' }));
    }
  }, [isOpen, medicines]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
      setForm({ medicine_id: medicines[0]?.id || '', batch_number: '', manufacturing_date: '', expiry_date: '', quantity_packs: 1, unit_cost: 0 });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not receive this stock batch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="receive-stock-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5">
          <h2 id="receive-stock-title" className="text-xl font-bold text-slate-900">Receive New Stock</h2>
          <p className="mt-1 text-sm text-slate-500">Add a batch to inventory. A receipt movement is recorded automatically.</p>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Medicine
            <select required value={form.medicine_id} onChange={(event) => setForm({ ...form, medicine_id: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm">
              <option value="" disabled>Select a medicine</option>
              {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} {medicine.strength}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Batch number
            <input required maxLength={100} value={form.batch_number} onChange={(event) => setForm({ ...form, batch_number: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="e.g. PAR-2026-001" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Manufacturing date (optional)<input type="date" max={new Date().toISOString().slice(0, 10)} value={form.manufacturing_date} onChange={(event) => setForm({ ...form, manufacturing_date: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
            <label className="block text-sm font-medium text-slate-700">Expiry date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.expiry_date} onChange={(event) => setForm({ ...form, expiry_date: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
            <label className="block text-sm font-medium text-slate-700">
              Quantity (packs)
              <input required type="number" min="1" step="1" value={form.quantity_packs} onChange={(event) => setForm({ ...form, quantity_packs: Number(event.target.value) })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Purchase unit cost (USD)<input required type="number" min="0" step="0.01" value={form.unit_cost} onChange={(event) => setForm({ ...form, unit_cost: Number(event.target.value) })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
          </div>
          {!medicines.length && <p className="text-sm text-amber-700">Add a medicine to the catalog before receiving stock.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving || !medicines.length} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">{saving ? 'Receiving…' : 'Receive Stock'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
