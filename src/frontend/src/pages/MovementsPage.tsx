import { useEffect, useMemo, useState } from 'react';
import { getMovements } from '../api';
import { MovementsControls } from '../components/MovementsControls';
import { MovementsTable } from '../components/MovementsTable';

async function fetchMovements() {
  try {
    const result = await getMovements(1, 100);
    return result.items.map((movement: any) => ({
      ...movement,
      movement_type: movement.movement_type.toUpperCase(),
      quantity_change: movement.quantity_packs,
      performed_by: (movement as typeof movement & { performed_by_name?: string }).performed_by_name || movement.performed_by || 'System',
    }));
  } catch {
    return [];
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
          <p className="page-subtitle">Immutable audit history of receipts, issues, and adjustments across your pharmacy.</p>
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