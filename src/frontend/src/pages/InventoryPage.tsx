import React, { useState, useEffect } from 'react';
import {} from 'lucide-react';
import { KPIMetrics } from './components/KPIMetrics';
import { ControlsBar } from './components/ControlsBar';
import { InventoryTable } from './components/InventoryTable';
import { AddMedicineModal } from './components/AddMedicineModal';
import { StockStatusBadge, MedicineStatus, InventoryItem } from './types';
import { useNavigate } from 'react-router-dom';

// Mock API service - will be replaced with real fetch
async function fetchInventoryItems(filters = {}) {
  const { search = '', category = 'All Categories', stockFilter = 'all' } = filters;

  // Fetch from the backend API
  const response = await fetch(`/api/medicines?search=${encodeURIComponent(search)}&low_stock=${stockFilter === 'low'}&limit=100`);

  if (!response.ok) {
    throw new Error('Failed to fetch inventory data');
  }

  const data = await response.json();
  const medicines = data.data || [];

  // Transform medicine data into InventoryItem format
  const items: InventoryItem[] = medicines.map((med: any) => {
    const status =
      med.usable_stock === 0
        ? 'out-of-stock'
        : med.usable_stock < med.reorder_level
        ? 'low-stock'
        : 'in-stock';

    return {
      id: med.id,
      name: med.name,
      strength: med.strength || '',
      dosage_form: med.dosage_form || '',
      pack_size: med.pack_size || 0,
      category: med.category || 'Other',
      reorder_level: med.reorder_level || 10,
      usable_stock: med.usable_stock || 0,
      unit_price: med.unit_price || 0,
      status,
      is_active: med.is_active !== false,
      created_at: med.created_at || new Date().toISOString(),
      updated_at: med.updated_at || new Date().toISOString(),
    };
  });

  return { items, total: data.total || items.length };
}

export function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // KPI state
  const [kpiTotal, setKPITotal] = useState(0);
  const [kpiLowStock, setKPILowStock] = useState(0);
  const [kpiOutOfStock, setKPIOutOfStock] = useState(0);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { items, total } = await fetchInventoryItems({
        search: searchQuery,
        category: categoryFilter,
        stockFilter,
      });

      setItems(items);
      setTotal(total);

      // Calculate KPIs
      const totalItems = items.length;
      const lowStockCount = items.filter(
        (item) => item.status === 'low-stock'
      ).length;
      const outOfStockCount = items.filter(
        (item) => item.status === 'out-of-stock'
      ).length;

      setKPITotal(totalItems);
      setKPILowStock(lowStockCount);
      setKPIOutOfStock(outOfStockCount);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate KPIs when filters change
  React.useEffect(() => {
    const calculateKPIs = () => {
      const lowStockCount = items.filter(
        (item) => item.status === 'low-stock'
      ).length;
      const outOfStockCount = items.filter(
        (item) => item.status === 'out-of-stock'
      ).length;
      setKPITotal(items.length);
      setKPILowStock(lowStockCount);
      setKPIOutOfStock(outOfStockCount);
    };
    calculateKPIs();
  }, [items, stockFilter]);

  const handleAddMedicine = async () => {
    // Trigger the modal - in a full implementation, this would open a modal
    // For now, we'll just navigate or alert
    alert('Add medicine functionality would open a modal form');
  };

  const handleReceiveStock = () => {
    // Trigger stock receipt modal
    alert('Stock receipt modal would open');
    navigate('/batches');
  };

  const filteredItems = items.filter((item) => {
    // Category filter
    const categoryMatch =
      categoryFilter === 'All Categories' || item.category === categoryFilter;

    // Stock filter
    const stockMatch =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? item.status === 'low-stock'
        : item.status === 'out-of-stock';

    return categoryMatch && stockMatch;
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Master Inventory Catalog
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Central pharmaceutical inventory registry, stock level monitoring, and reorder control.
      </p>

      {/* KPI Metrics Row */}
      <KPIMetrics
        totalItems={kpiTotal}
        lowStockItems={kpiLowStock}
        outOfStockItems={kpiOutOfStock}
      />

      {/* Controls & Filter Bar */}
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

      {/* Inventory Table */}
      <InventoryTable items={filteredItems} />

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={(data) => {
          // Handle form submission - create new medicine
          console.log('Adding medicine:', data);
          // In a full implementation, this would POST to /api/medicines
          alert(`Adding medicine: ${data.name}`);
        }}
      />
    </div>
  );
}