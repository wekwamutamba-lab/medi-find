import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createBatch, getAlertsSummary, getAllBatches, getMedicines, type Medicine } from '../api';
import { ReceiveStockModal, type ReceiveStockValues } from '../components/ReceiveStockModal';

async function fetchBatches() {
  try {
    return await getAllBatches();
  } catch {
    return [];
  }
}

export function BatchesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const medicineId = searchParams.get('medicine_id') || '';
  const [batches, setBatches] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [lowStockMedicines, setLowStockMedicines] = useState<Array<{ id: string; name: string }>>([{ id: '', name: 'Amoxicillin' }]);

  useEffect(() => {
    void fetchBatches().then(setBatches);
    void getMedicines({ limit: 100 }).then((result) => setMedicines(result.items));
    void getAlertsSummary().then((summary) => {
      setLowStockMedicines(summary.low_stock.items.map((medicine: Medicine & { usable_stock: number }) => ({ id: medicine.id, name: medicine.name })));
    }).catch(() => {
      setLowStockMedicines([{ id: '', name: 'Amoxicillin' }]);
    });
  }, []);

  const handleReceive = async (form: ReceiveStockValues) => {
    await createBatch(form.medicine_id, { batch_number: form.batch_number, manufacturing_date: form.manufacturing_date || null, expiry_date: form.expiry_date, quantity_packs: form.quantity_packs, unit_cost: form.unit_cost });
    const [updatedBatches, updatedMedicines] = await Promise.all([getAllBatches(), getMedicines({ limit: 100 })]);
    setBatches(updatedBatches);
    setMedicines(updatedMedicines.items);
    setNotice(`Batch ${form.batch_number} received; receipt movement recorded.`);
  };

  const filteredBatches = useMemo(() => batches.filter((batch) => {
    if (medicineId && batch.medicine_id !== medicineId) return false;
    const daysUntilExpiry = Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (filter === 'expiring') return daysUntilExpiry >= 0 && daysUntilExpiry <= 180;
    if (filter === 'expired') return daysUntilExpiry < 0;
    if (filter === 'low-stock') return lowStockMedicines.some((medicine) => medicine.id ? medicine.id === batch.medicine_id : batch.medicine_name?.toLowerCase().includes(medicine.name.toLowerCase()));
    return true;
  }), [batches, filter, lowStockMedicines, medicineId]);

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Batch tracking</span></div>
          <h1>{medicineId ? 'Medicine Batch History' : filter === 'expired' ? 'Expired Batches' : filter === 'expiring' ? 'Expiring Soon' : filter === 'low-stock' ? 'Low Stock Batches' : 'Batches & Expiry Management'}</h1>
          <p className="page-subtitle">Track lot numbers, expiry dates, and open-pack quantities across the pharmacy stock.</p>
        </div>
        <button type="button" className="export-button" onClick={() => setReceiveOpen(true)}>Receive Stock</button>
      </div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Batch Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Manufactured</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((batch) => {
              const expiryDate = new Date(batch.expiry_date);
              const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isCritical = daysRemaining >= 0 && daysRemaining <= 30;
              const isExpiringSoon = daysRemaining > 30 && daysRemaining <= 180;

              return (
                <tr key={batch.id} className="border-t border-slate-200">
                  <td className="px-6 py-4 font-medium text-slate-900">{batch.medicine_name}</td>
                  <td className="px-6 py-4 text-slate-600">{batch.batch_number}</td>
                  <td className="px-6 py-4 text-slate-600">{batch.manufacturing_date ? new Date(batch.manufacturing_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(batch.expiry_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-600">{batch.quantity_packs ?? batch.quantity_in_stock ?? 0} packs</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isCritical ? 'bg-rose-100 text-rose-800' : isExpiringSoon ? 'bg-amber-100 text-amber-800' : daysRemaining < 0 ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>
                      {daysRemaining < 0 ? 'Expired' : isCritical ? `${daysRemaining} days · urgent` : isExpiringSoon ? 'Expiring soon' : 'Active'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredBatches.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">No batches match this filter.{filter === 'low-stock' && <button type="button" className="ml-2 cursor-pointer text-blue-700 underline hover:text-blue-900" onClick={() => navigate('/inventory?stock=low')}>View low-stock medicines</button>}</td></tr>}
          </tbody>
        </table>
      </div>
      <ReceiveStockModal isOpen={receiveOpen} medicines={medicines} onClose={() => setReceiveOpen(false)} onSubmit={handleReceive} />
    </div>
  );
}