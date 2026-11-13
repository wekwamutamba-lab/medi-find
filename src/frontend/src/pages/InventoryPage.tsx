import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { archiveMedicine, createMedicine, getMedicine, getMedicines, updateMedicine } from '../api';
import { AddMedicineModal, type MedicineFormValues } from '../components/AddMedicineModal';
import { ControlsBar } from '../components/ControlsBar';
import { InventoryTable } from '../components/InventoryTable';
import { KPIMetrics } from '../components/KPIMetrics';
import type { InventoryItem } from '../types';

function normalizeMedicine(medicine: any): InventoryItem {
  const usableStock = Number(medicine.usable_stock ?? medicine.current_stock ?? 0);
  const reorderLevel = Number(medicine.reorder_level ?? medicine.reorderThreshold ?? 10);
  const status: InventoryItem['status'] = usableStock === 0 ? 'out-of-stock' : usableStock < reorderLevel ? 'low-stock' : 'in-stock';

  return {
    id: medicine.id,
    name: medicine.name,
    strength: medicine.strength || '',
    dosage_form: medicine.dosage_form || '',
    pack_size: Number(medicine.pack_size ?? 0),
    category: medicine.category || 'Other',
    reorder_level: reorderLevel,
    usable_stock: usableStock,
    unit_price: Number(medicine.unit_price ?? 0),
    status,
    is_active: medicine.is_active !== false,
    created_at: medicine.created_at || new Date().toISOString(),
    updated_at: medicine.updated_at || new Date().toISOString(),
  };
}

async function fetchInventoryItems(filters: { search?: string; category?: string; stockFilter?: 'all' | 'low' | 'out' } = {}) {
  const { search = '', category = 'All Categories', stockFilter = 'all' } = filters;

  try {
    const result = await getMedicines({ search, limit: 100, low_stock: stockFilter === 'low' });
    const items = result.items.filter((item) => category === 'All Categories' || item.category === category);

    return {
      items: items.map(normalizeMedicine),
      total: result.total,
    };
  } catch (error) {
    console.warn('Inventory request failed:', error);
    return { items: [], total: 0 };
  }
}

export function InventoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const medicineId = searchParams.get('medicine_id') || '';
  const requestedLowStock = searchParams.get('stock') === 'low';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All Categories' | 'Analgesics' | 'Antibiotics' | 'Antihistamines' | 'Antidiabetics' | 'Gastric' | 'Respiratory'>('All Categories');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>(requestedLowStock ? 'low' : 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [modalValues, setModalValues] = useState<MedicineFormValues | undefined>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      if (medicineId) {
        try {
          const selected = await getMedicine(medicineId);
          if (!selected?.id) throw new Error('Medicine was not found.');
          if (active) setItems([normalizeMedicine(selected)]);
          setLoading(false);
          return;
        } catch {
          const fallback = await fetchInventoryItems({ search: searchQuery, category: categoryFilter, stockFilter });
          const selectedItem = fallback.items.find((item) => item.id === medicineId);
          if (active) setItems(selectedItem ? [selectedItem] : fallback.items);
          setLoading(false);
          return;
        }
      }
      const result = await fetchInventoryItems({ search: searchQuery, category: categoryFilter, stockFilter });
      if (active) {
        setItems(result.items);
      }
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [searchQuery, categoryFilter, stockFilter, medicineId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch = categoryFilter === 'All Categories' || item.category === categoryFilter;
      const stockMatch =
        stockFilter === 'all'
          ? true
          : stockFilter === 'low'
            ? item.status === 'low-stock'
            : item.status === 'out-of-stock';

      const searchMatch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && stockMatch && searchMatch;
    });
  }, [items, categoryFilter, searchQuery, stockFilter]);

  const kpiTotal = filteredItems.length;
  const kpiLowStock = filteredItems.filter((item) => item.status === 'low-stock').length;
  const kpiOutOfStock = filteredItems.filter((item) => item.status === 'out-of-stock').length;

  const handleAddMedicine = async () => {
    setEditingMedicineId(null);
    setModalValues(undefined);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (data: MedicineFormValues) => {
    const payload = {
      name: data.name,
      strength: data.strength,
      dosage_form: data.dosage_form,
      pack_size: data.pack_size,
      category: data.category,
      reorder_level: data.reorder_level,
      unit_price: data.unit_price,
      notes: data.notes || null,
      is_active: true,
    };
    if (editingMedicineId) {
      const updated = await updateMedicine(editingMedicineId, payload);
      setItems((current) => current.map((item) => item.id === editingMedicineId ? normalizeMedicine(updated) : item));
      setNotice(`${data.name} updated.`);
    } else {
      const created = await createMedicine(payload);
      setItems((current) => [normalizeMedicine(created), ...current]);
      setNotice(`${data.name} added to the catalog.`);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingMedicineId(item.id);
    setModalValues({ name: item.name, strength: item.strength, dosage_form: item.dosage_form || 'Tablet', pack_size: item.pack_size || 1, category: item.category || 'Other', reorder_level: item.reorder_level, unit_price: item.unit_price, notes: '' });
    setIsAddModalOpen(true);
  };

  const handleArchive = async (item: InventoryItem) => {
    if (!window.confirm(`Archive ${item.name} from the active catalog?`)) return;
    setError('');
    try {
      await archiveMedicine(item.id);
      setItems((current) => current.filter((medicine) => medicine.id !== item.id));
      setNotice(`${item.name} archived.`);
    } catch (archiveError) { setError(archiveError instanceof Error ? archiveError.message : 'Could not archive medicine.'); }
  };

  const handleReceiveStock = () => {
    navigate('/batches');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Live catalog</span></div>
          <h1>{medicineId ? 'Selected Medicine' : stockFilter === 'low' ? 'Low Stock Medicines' : 'Master Inventory Catalog'}</h1>
          <p className="page-subtitle">Central pharmaceutical inventory registry, stock level monitoring, and reorder control.</p>
        </div>
      </div>

      <KPIMetrics totalItems={kpiTotal} lowStockItems={kpiLowStock} outOfStockItems={kpiOutOfStock} />

      <ControlsBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        onAddMedicine={handleAddMedicine}
        onReceiveStock={handleReceiveStock}
      />

      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      {loading ? <p className="text-slate-500 text-sm">Loading inventory...</p> : <InventoryTable items={filteredItems} onEdit={handleEdit} onArchive={handleArchive} onViewBatches={(item) => navigate(`/batches?medicine_id=${encodeURIComponent(item.id)}`)} />}
      <AddMedicineModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddSubmit} initialValues={modalValues} title={editingMedicineId ? 'Edit Medicine' : 'Add Medicine to Catalog'} submitLabel={editingMedicineId ? 'Save Changes' : 'Add Medicine'} />
    </div>
  );
}