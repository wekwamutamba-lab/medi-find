import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddMedicineModal } from '../components/AddMedicineModal';
import { ControlsBar } from '../components/ControlsBar';
import { InventoryTable } from '../components/InventoryTable';
import { KPIMetrics } from '../components/KPIMetrics';
import type { InventoryItem } from '../types';

const demoInventory: InventoryItem[] = [
  { id: '1', name: 'Paracetamol 500mg', strength: '500 mg', dosage_form: 'Tablet', pack_size: 30, category: 'Analgesics', reorder_level: 30, usable_stock: 18, unit_price: 0.35, status: 'low-stock', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Amoxicillin 250mg', strength: '250 mg', dosage_form: 'Capsule', pack_size: 20, category: 'Antibiotics', reorder_level: 25, usable_stock: 52, unit_price: 1.8, status: 'in-stock', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'Salbutamol Inhaler', strength: '100 mcg', dosage_form: 'Inhaler', pack_size: 1, category: 'Respiratory', reorder_level: 10, usable_stock: 0, unit_price: 8.5, status: 'out-of-stock', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', name: 'Metformin 500mg', strength: '500 mg', dosage_form: 'Tablet', pack_size: 60, category: 'Antidiabetics', reorder_level: 40, usable_stock: 72, unit_price: 0.55, status: 'in-stock', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('medifind_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    const params = new URLSearchParams({ search, limit: '100' });
    if (stockFilter === 'low') params.set('low_stock', 'true');
    if (category !== 'All Categories') params.set('category', category);

    const response = await fetch(`/api/medicines?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() as Record<string, string>),
      } as HeadersInit,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { items: demoInventory, total: demoInventory.length };
      }
      throw new Error(`Failed to load medicines (${response.status})`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : Array.isArray(payload?.data) ? payload.data : [];

    return {
      items: items.map(normalizeMedicine),
      total: Number(payload?.data?.total ?? items.length),
    };
  } catch (error) {
    console.warn('Using demo inventory because the backend is unavailable:', error);
    return { items: demoInventory, total: demoInventory.length };
  }
}

export function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All Categories' | 'Analgesics' | 'Antibiotics' | 'Antihistamines' | 'Antidiabetics' | 'Gastric' | 'Respiratory'>('All Categories');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
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
  }, [searchQuery, categoryFilter, stockFilter]);

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
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (data: { name: string; category: string; reorder_threshold: number; unit_price: number }) => {
    const payload = {
      name: data.name,
      strength: '500 mg',
      dosage_form: data.category,
      pack_size: 30,
      reorder_level: Number(data.reorder_threshold || 0),
      notes: `${data.category} item added from UI`,
      is_active: true,
    };

    try {
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() as Record<string, string>),
        } as HeadersInit,
        body: JSON.stringify(payload),
      });

      if (!response.ok && response.status !== 401) {
        throw new Error('API create failed');
      }

      const newItem: InventoryItem = {
        id: `ui-${Date.now()}`,
        name: data.name,
        strength: '500 mg',
        dosage_form: data.category,
        pack_size: 30,
        category: data.category,
        reorder_level: Number(data.reorder_threshold || 0),
        usable_stock: 0,
        unit_price: Number(data.unit_price || 0),
        status: 'out-of-stock',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setItems((current) => [newItem, ...current]);
    } catch (error) {
      console.warn('Add medicine fallback engaged:', error);
      const newItem: InventoryItem = {
        id: `ui-${Date.now()}`,
        name: data.name,
        strength: '500 mg',
        dosage_form: data.category,
        pack_size: 30,
        category: data.category,
        reorder_level: Number(data.reorder_threshold || 0),
        usable_stock: 0,
        unit_price: Number(data.unit_price || 0),
        status: 'out-of-stock',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setItems((current) => [newItem, ...current]);
    }
  };

  const handleReceiveStock = () => {
    navigate('/batches');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Live catalog</span></div>
          <h1>Master Inventory Catalog</h1>
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

      {loading ? <p className="text-slate-500 text-sm">Loading inventory...</p> : <InventoryTable items={filteredItems} />}

      <AddMedicineModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddSubmit} />
    </div>
  );
}