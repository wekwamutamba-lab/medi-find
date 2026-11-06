import { useEffect, useMemo, useState } from 'react';
import { getStoredAccessToken } from '../api';
import { MovementsControls } from '../components/MovementsControls';
import { MovementsTable } from '../components/MovementsTable';

const demoMovements = [
  { id: 'm1', medicine_name: 'Paracetamol 500mg', strength: '500 mg', batch_number: 'PC-1042', movement_type: 'RECEIPT', quantity_change: 40, reason: 'Supplier delivery', performed_by: 'S. Singh', created_at: '2026-11-05T09:35:00.000Z' },
  { id: 'm2', medicine_name: 'Amoxicillin 250mg', strength: '250 mg', batch_number: 'AM-8821', movement_type: 'ISSUE', quantity_change: 18, reason: 'Ward dispensing', performed_by: 'M. Jones', created_at: '2026-11-04T08:15:00.000Z' },
  { id: 'm3', medicine_name: 'Salbutamol Inhaler', strength: '100 mcg', batch_number: 'SB-7714', movement_type: 'QUARANTINE', quantity_change: 2, reason: 'Damaged packaging identified', performed_by: 'N. Patel', created_at: '2026-11-03T12:00:00.000Z' },
  { id: 'm4', medicine_name: 'Metformin 500mg', strength: '500 mg', batch_number: 'MT-3316', movement_type: 'ADJUSTMENT', quantity_change: 5, reason: 'Shelf count correction', performed_by: 'R. Ali', created_at: '2026-11-02T11:45:00.000Z' },
];

function getAuthHeaders(): Record<string, string> {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMovements() {
  try {
    const response = await fetch('/api/batches', {
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() as Record<string, string>),
      } as HeadersInit,
    });
    if (!response.ok) {
      if (response.status === 401) return demoMovements;
      throw new Error('Unable to load movements');
    }
    return demoMovements;
  } catch (error) {
    console.warn('Using demo movement fallback:', error);
    return demoMovements;
  }
}

export function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'All' | 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'QUARANTINE'>('All');
  const [dateFilter, setDateFilter] = useState<'All Time' | 'Today' | 'Last 7 Days' | 'Last 30 Days'>('All Time');

  useEffect(() => {
    void fetchMovements().then(setMovements);
  }, []);

  const filteredMovements = useMemo(() => {
    const now = Date.now();
    return movements.filter((entry) => {
      const matchesQuery = !searchQuery || [entry.medicine_name, entry.batch_number, entry.reason, entry.performed_by].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = movementTypeFilter === 'All' || entry.movement_type === movementTypeFilter;

      let matchesDate = true;
      if (dateFilter === 'Today') {
        const diffDays = (now - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24);
        matchesDate = diffDays <= 1;
      }
      if (dateFilter === 'Last 7 Days') {
        const diffDays = (now - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24);
        matchesDate = diffDays <= 7;
      }
      if (dateFilter === 'Last 30 Days') {
        const diffDays = (now - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24);
        matchesDate = diffDays <= 30;
      }

      return matchesQuery && matchesType && matchesDate;
    });
  }, [dateFilter, movementTypeFilter, movements, searchQuery]);

  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Medicine', 'Batch', 'Type', 'Quantity', 'Reason', 'Performed By'],
      ...filteredMovements.map((entry) => [new Date(entry.created_at).toISOString(), entry.medicine_name, entry.batch_number, entry.movement_type, String(entry.quantity_change), entry.reason, entry.performed_by]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medifind_movements.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Audit log</span></div>
          <h1>Stock Movements Audit Log</h1>
          <p className="page-subtitle">Review receipts, issues, adjustments, and quarantines across the stock ledger.</p>
        </div>
      </div>

      <MovementsControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        movementTypeFilter={movementTypeFilter}
        setMovementTypeFilter={setMovementTypeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onExportCsv={handleExportCsv}
      />

      <MovementsTable movements={filteredMovements} />
    </div>
  );
}