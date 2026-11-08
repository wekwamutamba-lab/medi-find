import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeDollarSign, Bell, Building2, ChevronDown, CircleDollarSign, PackageCheck, Pill, ReceiptText, Users } from 'lucide-react';
import { createBatch, createMedicine, getAlertsSummary, getMedicines, getSales, readSession, type AttentionSummary, type Medicine, type SaleRecord } from '../api';
import { AddMedicineModal, type MedicineFormValues } from '../components/AddMedicineModal';
import { ReceiveStockModal, type ReceiveStockValues } from '../components/ReceiveStockModal';
import { formatCurrency, getDashboardStats, type DashboardRange, dashboardRangeLabels } from '../lib/dashboardMetrics';

const metricDefinitions = [
  { label: 'Total Revenue', icon: CircleDollarSign, tone: 'blue' },
  { label: 'Monthly Sales', icon: ReceiptText, tone: 'teal' },
  { label: 'Active Inventory', icon: PackageCheck, tone: 'amber' },
  { label: 'Expiring Batches', icon: BadgeDollarSign, tone: 'purple' },
];

const quickCards = [
  { title: 'New Sale', subtitle: 'Create a new sale in just a few clicks', tone: 'blue', icon: BadgeDollarSign },
  { title: 'New Purchase', subtitle: 'Receive a batch and record stock', tone: 'teal', icon: ReceiptText },
  { title: 'Add Medicine', subtitle: 'Create a catalog medicine', tone: 'purple', icon: Pill },
  { title: 'Add Customer', subtitle: 'Create a customer profile', tone: 'sky', icon: Users },
];

const fallbackMedicines: Medicine[] = [
  { id: '1', name: 'Paracetamol', strength: '500 mg', dosage_form: 'Tablet', pack_size: 30, category: 'Analgesics', reorder_level: 30, unit_price: 0.35, notes: null, is_active: true, usable_stock: 18 },
  { id: '2', name: 'Amoxicillin', strength: '250 mg', dosage_form: 'Capsule', pack_size: 20, category: 'Antibiotics', reorder_level: 25, unit_price: 1.8, notes: null, is_active: true, usable_stock: 52 },
  { id: '3', name: 'Metformin', strength: '500 mg', dosage_form: 'Tablet', pack_size: 60, category: 'Antidiabetics', reorder_level: 40, unit_price: 0.55, notes: null, is_active: true, usable_stock: 72 },
];

interface DashboardPageProps {
  dateRange: DashboardRange;
  customDate: string;
  onDateRangeChange: (range: DashboardRange) => void;
  onCustomDateChange: (date: string) => void;
}

export function DashboardPage({ dateRange, customDate, onDateRangeChange, onCustomDateChange }: DashboardPageProps) {
  const navigate = useNavigate();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [panelMenu, setPanelMenu] = useState<'medicines' | 'categories' | null>(null);
  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState<AttentionSummary | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.allSettled([getMedicines({ limit: 100 }), getAlertsSummary(), getSales()]).then(([medicineResult, alertResult, salesResult]) => {
      if (!active) return;
      if (medicineResult.status === 'fulfilled') setMedicines(medicineResult.value.items);
      if (alertResult.status === 'fulfilled') setSummary(alertResult.value);
      if (salesResult.status === 'fulfilled') setSales(salesResult.value);
    });
    return () => { active = false; };
  }, []);

  const stats = getDashboardStats(dateRange, customDate);
  const inventory = medicines.length ? medicines.filter((medicine) => medicine.is_active) : fallbackMedicines;
  const rangeSales = useMemo(() => sales.filter((sale) => {
    const date = new Date(sale.created_at);
    const now = new Date();
    if (dateRange === 'today') return date.toDateString() === now.toDateString();
    if (dateRange === 'week') return now.getTime() - date.getTime() <= 7 * 86_400_000;
    if (dateRange === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return !customDate || date.toISOString().slice(0, 10) === customDate;
  }), [sales, dateRange, customDate]);
  const rangeRevenue = rangeSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const salesByMedicine = useMemo(() => {
    const totals = new Map<string, { medicine_id: string; name: string; quantity: number; revenue: number }>();
    for (const sale of rangeSales) for (const line of sale.items ?? []) {
      const current = totals.get(line.medicine_id) ?? { medicine_id: line.medicine_id, name: line.medicine_name, quantity: 0, revenue: 0 };
      current.quantity += line.quantity_packs;
      current.revenue += Number(line.line_total ?? line.unit_price * line.quantity_packs);
      totals.set(line.medicine_id, current);
    }
    return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  }, [rangeSales]);
  const topItems = useMemo(() => salesByMedicine.length ? salesByMedicine.map((item, index) => ({
    id: item.medicine_id, name: item.name, quantity: item.revenue, percent: Math.min(100, Math.round(item.revenue / Math.max(...salesByMedicine.map((entry) => entry.revenue), 1) * 100)), fill: ['fill-blue', 'fill-teal', 'fill-amber'][index] ?? 'fill-blue',
  })) : inventory.slice(0, 3).map((medicine, index) => ({
    id: medicine.id,
    name: `${medicine.name} ${medicine.strength}`.trim(),
    quantity: Number(medicine.unit_price ?? 0) * (stats.topUnits[index] ?? Math.round(stats.topUnits[0] / (index + 2))),
    percent: [72, 58, 41][index] ?? 35,
    fill: ['fill-blue', 'fill-teal', 'fill-amber'][index] ?? 'fill-blue',
  })), [inventory, stats, salesByMedicine]);

  const totalItems = medicines.length || 1284;
  const demoMode = readSession()?.access_token === 'demo-token';
  const metricValues = [formatCurrency(totalRevenue || stats.sales), formatCurrency(rangeRevenue || stats.sales), totalItems.toLocaleString('en-US'), String(summary?.expiring.count ?? (demoMode ? 1 : '—'))];
  const lowStockItems = summary?.low_stock.items ?? [];
  const expiringItems = summary?.expiring.items ?? [];
  const lowStockCount = summary?.low_stock.count ?? (demoMode ? 1 : 0);
  const expiringCount = summary?.expiring.count ?? (demoMode ? 1 : 0);

  const closeToast = () => setToast('');
  const handleQuickAction = (title: string) => {
    if (title === 'New Sale') {
      setMedicineModalOpen(false);
      setPurchaseModalOpen(false);
      navigate('/sales');
    }
    if (title === 'New Purchase') {
      setMedicineModalOpen(false);
      setPurchaseModalOpen(true);
    }
    if (title === 'Add Medicine') {
      setPurchaseModalOpen(false);
      setMedicineModalOpen(true);
    }
    if (title === 'Add Customer') {
      setMedicineModalOpen(false);
      setPurchaseModalOpen(false);
      navigate('/customers?action=new');
    }
  };

  const handleAddMedicine = async (form: MedicineFormValues) => {
    await createMedicine({
      name: form.name,
      strength: form.strength,
      dosage_form: form.dosage_form,
      pack_size: form.pack_size,
      category: form.category,
      reorder_level: form.reorder_level,
      unit_price: form.unit_price,
      notes: form.notes || null,
      is_active: true,
    });
    const result = await getMedicines({ limit: 100 });
    setMedicines(result.items);
    setToast(`${form.name} was added to the catalog.`);
  };

  const handleReceiveStock = async (form: ReceiveStockValues) => {
    await createBatch(form.medicine_id, {
      batch_number: form.batch_number,
      manufacturing_date: form.manufacturing_date || null,
      expiry_date: form.expiry_date,
      quantity_packs: form.quantity_packs,
      unit_cost: form.unit_cost,
    });
    const [medicineResult, alertResult] = await Promise.all([getMedicines({ limit: 100 }), getAlertsSummary()]);
    setMedicines(medicineResult.items);
    setSummary(alertResult);
    setToast(`Batch ${form.batch_number} received and a receipt movement recorded.`);
  };

  const exportDashboard = () => {
    const rows = [
      ['Period', dashboardRangeLabels[dateRange]],
      ['Sales', rangeRevenue || stats.sales],
      ['Purchases', stats.purchases],
      ['Inventory items', totalItems],
      ['Profit', stats.profit],
      ...topItems.map((item) => [item.name, item.quantity]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `medifind-dashboard-${dateRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Live overview</span></div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Track orders, stock levels, and pharmacy activity across the day.</p>
        </div>
        <div className="heading-tools">
          <div className="period-wrap">
            <button type="button" className="period-button" aria-expanded={periodOpen} onClick={() => setPeriodOpen((open) => !open)}>
              <span>{dashboardRangeLabels[dateRange]}</span>
              <ChevronDown size={12} />
            </button>
            {periodOpen && <div className="period-menu">
              {(['today', 'week', 'month', 'custom'] as DashboardRange[]).map((range) => (
                <button key={range} type="button" onClick={() => { onDateRangeChange(range); if (range !== 'custom') setPeriodOpen(false); }}>
                  {dashboardRangeLabels[range]}{range === dateRange && <span aria-hidden="true">✓</span>}
                </button>
              ))}
              {dateRange === 'custom' && <label className="date-menu-label">Pick a date<input type="date" value={customDate} onChange={(event) => onCustomDateChange(event.target.value)} /></label>}
            </div>}
          </div>
          <button type="button" className="export-button" onClick={exportDashboard}>
            <ArrowRight size={12} />
            Export
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {metricDefinitions.map(({ label, icon: Icon, tone }, index) => (
          <div key={label} className="metric-card">
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon icon-${tone}`}><Icon size={14} /></span>
            </div>
            <div className="metric-value">{metricValues[index]}</div>
            <div className="metric-foot">
              <span className={index === 3 ? 'trend-warning' : 'trend-positive'}>{index === 3 ? 'Review' : '+8.1%'}</span>
              <span>{index === 0 ? `${sales.length || 'Sample'} recorded receipts` : index === 1 ? dashboardRangeLabels[dateRange] : index === 2 ? 'active medicines' : 'require attention'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-section">
        <div className="section-heading">
          <h2>Quick Action</h2>
          <button type="button" className="text-action hover:text-blue-700" onClick={() => navigate('/sales')}>View all <ArrowRight size={10} /></button>
        </div>

        <div className="quick-grid">
          {quickCards.map(({ title, subtitle, tone, icon: Icon }) => (
            <button key={title} type="button" className={`quick-card quick-${tone}`} onClick={() => handleQuickAction(title)}>
              <div className="quick-icon"><Icon size={16} /></div>
              <div className="quick-copy">
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </div>
              <span className="quick-arrow"><ArrowRight size={12} /></span>
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Top-Selling Medicine Revenue</h2>
              <p>{rangeSales.length ? 'Based on completed receipts' : 'Sample revenue estimates for this period'}</p>
            </div>
            <button type="button" className="more-button" aria-label="Top medicines options" aria-expanded={panelMenu === 'medicines'} onClick={() => setPanelMenu(panelMenu === 'medicines' ? null : 'medicines')}>⋯</button>
          </div>
          {panelMenu === 'medicines' && <div className="panel-menu"><button type="button" onClick={() => navigate('/inventory')}>Open inventory</button><button type="button" onClick={exportDashboard}>Export current list</button></div>}

          <div className="inventory-search">
            <Building2 size={12} />
            <input value="All active medicines" readOnly aria-label="Top medicine list scope" />
          </div>

          <div className="table-header">
            <span>Medicine</span>
            <span>Trend</span>
            <span>Revenue</span>
          </div>

          {topItems.map((item) => (
            <button key={item.id} type="button" className="medicine-row medicine-row-button" onClick={() => navigate(`/inventory?medicine_id=${encodeURIComponent(item.id)}`)} title={`View ${item.name} in inventory`}>
              <div className="medicine-name">
                <div className="medicine-avatar"><Pill size={12} /></div>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.percent}% revenue share</small>
                </span>
              </div>
              <div className="stock-cell">
                <div className="stock-track"><span className={`stock-fill ${item.fill}`} style={{ width: `${item.percent}%` }} /></div>
              </div>
              <div className="units-count">{formatCurrency(item.quantity)}</div>
            </button>
          ))}

          {!topItems.length && <div className="empty-search">No active medicines found.</div>}
          <button type="button" className="panel-footer-link" onClick={() => navigate('/reports')}>See insights <ArrowRight size={10} /></button>
        </div>

        <div className="panel categories-panel">
          <div className="panel-heading">
            <div>
              <h2>Medicine categories</h2>
              <p>Usage mix</p>
            </div>
            <button type="button" className="more-button" aria-label="Category options" aria-expanded={panelMenu === 'categories'} onClick={() => setPanelMenu(panelMenu === 'categories' ? null : 'categories')}>⋯</button>
          </div>
          {panelMenu === 'categories' && <div className="panel-menu"><button type="button" onClick={() => navigate('/reports')}>Open performance reports</button><button type="button" onClick={() => navigate('/inventory')}>Browse inventory</button></div>}

          <div className="chart-content">
            <div className="donut-chart">
              <div className="donut-hole">
                <strong>2,847</strong>
                <span>units</span>
              </div>
            </div>
            <div className="legend-list">
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#4d79f6' }} /> Respiratory</div>
                <strong>23%</strong>
              </div>
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#27344a' }} /> Analgesics</div>
                <strong>18%</strong>
              </div>
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#8b95a4' }} /> Other</div>
                <strong>14%</strong>
              </div>
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#16aa83' }} /> Antibiotics</div>
                <strong>50%</strong>
              </div>
            </div>
          </div>

          <div className="category-note">
            <span className="note-check">✓</span>
            <span>Overall category mix is outperforming last month.</span>
          </div>
        </div>
      </div>

      <section className="panel sales-trend-panel">
        <div className="panel-heading"><div><h2>Sales volume over time</h2><p>{rangeSales.length ? 'Completed receipts in the selected range' : `Illustrative ${dashboardRangeLabels[dateRange].toLowerCase()} sample`}</p></div><strong>{formatCurrency(rangeRevenue || stats.sales)}</strong></div>
        <SalesTrendChart sales={rangeSales} fallbackTotal={stats.sales} />
      </section>

      <section className="alert-shortcuts" aria-label="Stock alerts">
        <div className="alert-shortcut-heading"><Bell size={14} /><strong>Stock alerts</strong><span>Click an alert to review the affected items</span></div>
        <button type="button" className="alert-shortcut alert-shortcut-low" onClick={() => navigate('/batches?filter=low-stock')}>
          <span><strong>{summary ? lowStockCount : demoMode ? lowStockCount : '—'} low-stock {lowStockCount === 1 ? 'medicine' : 'medicines'}</strong><small>{lowStockItems[0] ? `${lowStockItems[0].name} · ${lowStockItems[0].usable_stock} remaining` : demoMode ? 'Sample alert · Amoxicillin below reorder threshold' : 'Live alert data unavailable'}</small></span><ArrowRight size={14} />
        </button>
        <button type="button" className="alert-shortcut alert-shortcut-expiry" onClick={() => navigate('/batches?filter=expiring')}>
          <span><strong>{summary ? expiringCount : demoMode ? expiringCount : '—'} {expiringCount === 1 ? 'batch' : 'batches'} expiring soon</strong><small>{expiringItems[0] ? `${expiringItems[0].medicine_name ?? 'Batch'} · ${expiringItems[0].batch_number}` : demoMode ? 'Sample alert · PAR-2026-001 expires in 14 days' : 'Live alert data unavailable'}</small></span><ArrowRight size={14} />
        </button>
      </section>

      <div className="dashboard-footer">
        <span><span className="footer-status" /> System healthy</span>
        <span>Period: {dashboardRangeLabels[dateRange]}</span>
        <button type="button" onClick={() => navigate('/movements')}>Open activity log</button>
      </div>

      {toast && <div role="status" className="dashboard-toast">{toast}<button type="button" aria-label="Dismiss message" onClick={closeToast}>×</button></div>}
      <AddMedicineModal isOpen={medicineModalOpen} onClose={() => setMedicineModalOpen(false)} onSubmit={handleAddMedicine} />
      <ReceiveStockModal isOpen={purchaseModalOpen} medicines={inventory} onClose={() => setPurchaseModalOpen(false)} onSubmit={handleReceiveStock} />
    </div>
  );
}

function SalesTrendChart({ sales, fallbackTotal }: { sales: SaleRecord[]; fallbackTotal: number }) {
  const points = useMemo(() => {
    const values = Array.from({ length: 7 }, () => 0);
    if (sales.length) {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      for (const sale of sales) {
        const daysAgo = Math.floor((end.getTime() - new Date(sale.created_at).getTime()) / 86_400_000);
        const index = 6 - daysAgo;
        if (index >= 0 && index < values.length) values[index] += Number(sale.total_amount);
      }
    } else {
      [0.48, 0.62, 0.54, 0.73, 0.66, 0.88, 1].forEach((ratio, index) => { values[index] = fallbackTotal * ratio / 7; });
    }
    const maximum = Math.max(...values, 1);
    return values.map((value, index) => ({ value, x: 28 + index * 132, y: 112 - (value / maximum) * 86 }));
  }, [sales, fallbackTotal]);
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const dates = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return date.toLocaleDateString('en-US', { weekday: 'short' }); });

  return <div className="sales-trend-chart" role="img" aria-label="Sales revenue trend for the most recent seven days">
    <div className="sales-trend-axis"><span>{formatCurrency(Math.max(...points.map((point) => point.value)))}</span><span>{formatCurrency(0)}</span></div>
    <svg viewBox="0 0 820 132" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="salesTrendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4d79f6" stopOpacity=".2" /><stop offset="100%" stopColor="#4d79f6" stopOpacity="0" /></linearGradient></defs>
      {[26, 55, 84, 112].map((y) => <line key={y} x1="20" x2="815" y1={y} y2={y} stroke="#edf0f5" strokeDasharray="4 5" />)}
      <polygon points={`20,124 ${line} 815,124`} fill="url(#salesTrendFill)" />
      <polyline points={line} fill="none" stroke="#4d79f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => <circle key={point.x} cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#4d79f6" strokeWidth="2"><title>{`${dates[index]} · ${formatCurrency(point.value)}`}</title></circle>)}
    </svg>
    <div className="sales-trend-labels">{dates.map((date, index) => <span key={`${date}-${index}`}>{date}</span>)}</div>
  </div>;
}
