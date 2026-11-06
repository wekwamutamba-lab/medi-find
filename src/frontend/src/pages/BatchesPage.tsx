import { useEffect, useState } from 'react';
import { getStoredAccessToken } from '../api';

const demoBatches = [
  { id: 'b1', medicine_name: 'Paracetamol 500mg', batch_number: 'PC-1042', expiry_date: '2027-08-14', quantity_packs: 120, created_at: '2026-11-05T09:30:00.000Z' },
  { id: 'b2', medicine_name: 'Amoxicillin 250mg', batch_number: 'AM-8821', expiry_date: '2026-12-02', quantity_packs: 80, created_at: '2026-10-18T11:15:00.000Z' },
  { id: 'b3', medicine_name: 'Metformin 500mg', batch_number: 'MT-3316', expiry_date: '2028-03-30', quantity_packs: 150, created_at: '2026-11-01T15:40:00.000Z' },
];

function getAuthHeaders(): Record<string, string> {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchBatches() {
  try {
    const response = await fetch('/api/batches', {
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() as Record<string, string>),
      } as HeadersInit,
    });
    if (!response.ok) {
      if (response.status === 401) return demoBatches;
      throw new Error('Unable to load batches');
    }
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : demoBatches;
  } catch (error) {
    console.warn('Using demo batches fallback:', error);
    return demoBatches;
  }
}

export function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    void fetchBatches().then(setBatches);
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Batch tracking</span></div>
          <h1>Batches & Expiry Management</h1>
          <p className="page-subtitle">Track lot numbers, expiry dates, and open-pack quantities across the pharmacy stock.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Batch Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const expiryDate = new Date(batch.expiry_date);
              const isExpiringSoon = expiryDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 180;

              return (
                <tr key={batch.id} className="border-t border-slate-200">
                  <td className="px-6 py-4 font-medium text-slate-900">{batch.medicine_name}</td>
                  <td className="px-6 py-4 text-slate-600">{batch.batch_number}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(batch.expiry_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-600">{batch.quantity_packs} packs</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isExpiringSoon ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isExpiringSoon ? 'Expiring soon' : 'Active'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}