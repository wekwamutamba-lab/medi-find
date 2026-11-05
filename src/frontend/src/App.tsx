import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowDownUp,
  ArrowRight,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Pill,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Truck,
  UsersRound,
  X,
} from 'lucide-react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

type NavItem = { label: string; icon: typeof LayoutDashboard };

const navGroups: { title?: string; items: NavItem[] }[] = [
  { items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Inventory',
    items: [
      { label: 'Medicines', icon: Pill },
      { label: 'Batches & expiry', icon: Boxes },
      { label: 'Stock movements', icon: ArrowDownUp },
      { label: 'Suppliers', icon: Truck },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Alerts', icon: Bell },
      { label: 'AI assistant', icon: Sparkles },
    ],
  },
];

const inventory = [
  { name: 'Napa Extra', strength: '500 mg · Tablet', stock: 841, status: 'In stock', category: 'Analgesics', color: 'blue' },
  { name: 'Seclo', strength: '20 mg · Capsule', stock: 611, status: 'In stock', category: 'Gastric', color: 'teal' },
  { name: 'Fexo', strength: '120 mg · Tablet', stock: 498, status: 'Low stock', category: 'Antihistamine', color: 'blue' },
  { name: 'Monas', strength: '10 mg · Tablet', stock: 356, status: 'In stock', category: 'Respiratory', color: 'amber' },
];

const quickActions = [
  { label: 'Add medicine', description: 'Add a medicine to your catalog', icon: Pill, tone: 'blue', page: 'Medicines' },
  { label: 'Receive stock', description: 'Create a batch and record stock', icon: PackagePlus, tone: 'teal', page: 'Stock movements' },
  { label: 'Record movement', description: 'Issue or adjust inventory', icon: ArrowDownUp, tone: 'purple', page: 'Stock movements' },
  { label: 'Review alerts', description: 'Check low stock and expiry', icon: ShieldAlert, tone: 'sky', page: 'Alerts' },
];

const categoryData = [
  { label: 'Analgesics', count: 23, color: '#4d79f6' },
  { label: 'Gastric', count: 18, color: '#263347' },
  { label: 'Respiratory', count: 18, color: '#7d8798' },
  { label: 'Antihistamine', count: 16, color: '#00a982' },
  { label: 'Other', count: 25, color: '#dce4f2' },
];

function Sidebar({ activePage, onNavigate, onClose, navigate }: { activePage: string; onNavigate: (page: string) => void; onClose?: () => void; navigate: (page: string) => void }) {
  return (
    <>
      <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); onNavigate('Dashboard'); onClose?.(); }}>
        <span className="brand-mark"><span>m</span></span>
        <span className="brand-name">MediFind<span className="brand-ai">AI</span></span>
        <button className="sidebar-collapse" aria-label="Close navigation" onClick={(event) => { event.preventDefault(); onClose?.(); }}><ChevronLeft size={16} /></button>
      </a>
      <nav className="side-nav" aria-label="Main navigation">
        {navGroups.map((group, index) => (
          <div className="nav-group" key={group.title ?? 'home'}>
            {group.title && <p className="nav-heading">{group.title}</p>}
            {group.items.map(({ label, icon: Icon }) => (
              <button
                className={`nav-link ${activePage === label ? 'active' : ''}`}
                key={label}
                type="button"
                onClick={() => { onNavigate(label); onClose?.(); }}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {label === 'Alerts' && <span className="nav-count">8</span>}
                {index > 0 && label === 'Batches & expiry' && <ChevronDown className="nav-chevron" size={14} />}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-icon"><CircleHelp size={17} /></span>
          <div><strong>Need a hand?</strong><span>Visit the help center</span></div>
          <ArrowRight size={15} />
        </div>
        <button className="nav-link settings-link" type="button" onClick={() => onNavigate('Settings')}><Settings2 size={17} /><span>Settings</span></button>
        <div className="sidebar-user">
          <div className="avatar avatar-small">JM</div>
          <div className="sidebar-user-copy"><strong>Jubayer Mahbub</strong><span>Administrator</span></div>
          <ChevronDown size={15} />
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [period, setPeriod] = useState('Today');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [exported, setExported] = useState(false);

  const filteredInventory = useMemo(
    () => inventory.filter((item) => `${item.name} ${item.strength} ${item.category}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const navigate = (page: string) => setActivePage(page);
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  const exportInventory = () => {
    const csv = ['Medicine,Strength,Stock,Status,Category', ...inventory.map((item) => `${item.name},${item.strength},${item.stock},${item.status},${item.category}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medifind-inventory-preview.csv';
    link.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2200);
  };

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <Sidebar activePage={activePage} onNavigate={navigate} onClose={() => setMobileNavOpen(false)} />
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
            <div className="location-mark"><Plus size={16} strokeWidth={3} /></div>
            <div className="location-copy"><strong>Healthcare Pharmacy</strong><span><span className="location-dot" /> Dhanmondi, Dhaka</span></div>
          </div>
          <div className="topbar-actions">
            <div className="date-pill"><CalendarDays size={15} /><span>{today}</span></div>
            <div className="notification-wrap">
              <button className={`icon-button notification-button ${notificationsOpen ? 'selected' : ''}`} aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={17} /><span className="notification-dot" />
              </button>
              {notificationsOpen && <div className="notification-popover"><div className="popover-title"><strong>Notifications</strong><span>2 new</span></div><div className="notification-item"><span className="notice-symbol notice-red"><ShieldAlert size={15} /></span><span><strong>Low stock alert</strong><small>Fexo 120 mg is below reorder level.</small></span></div><div className="notification-item"><span className="notice-symbol notice-amber"><Clock3 size={15} /></span><span><strong>Expiry reminder</strong><small>3 batches expire within 60 days.</small></span></div><button className="view-alerts" onClick={() => { navigate('Alerts'); setNotificationsOpen(false); }}>View all alerts <ArrowRight size={14} /></button></div>}
            </div>
            <button className="profile-pill" type="button" aria-label="Administrator profile">
              <span className="avatar">JM</span><span className="profile-copy"><strong>Jubayer Mahbub</strong><small>Admin</small></span><ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading-row">
            <div>
              <div className="eyebrow">PHARMACY OVERVIEW <span className="preview-badge"><span /> Sample data</span></div>
              <h1>{activePage}</h1>
              <p className="page-subtitle">Here’s what’s happening with your pharmacy today.</p>
            </div>
            <div className="heading-tools">
              <div className="period-wrap">
                <button className="period-button" onClick={() => setPeriodOpen(!periodOpen)}>{period}<ChevronDown size={14} /></button>
                {periodOpen && <div className="period-menu">{['Today', 'This week', 'This month'].map((value) => <button key={value} onClick={() => { setPeriod(value); setPeriodOpen(false); }}>{value}{period === value && <Check size={14} />}</button>)}</div>}
              </div>
              <button className="export-button" onClick={exportInventory}>{exported ? <Check size={15} /> : <ArrowDownToLine size={15} />}{exported ? 'Exported' : 'Export'}</button>
            </div>
          </div>

          <section className="metrics-grid" aria-label="Pharmacy summary">
            <article className="metric-card"><div className="metric-top"><span>Total medicines</span><span className="metric-icon icon-blue"><Pill size={17} /></span></div><div className="metric-value">1,284</div><div className="metric-foot"><span className="trend-positive">↗ 12.4%</span><span> vs last month</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>Available stock</span><span className="metric-icon icon-teal"><Boxes size={17} /></span></div><div className="metric-value">8,450</div><div className="metric-foot"><span className="trend-positive">↗ 8.6%</span><span> packs in inventory</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>Low stock</span><span className="metric-icon icon-amber"><Activity size={17} /></span></div><div className="metric-value">12</div><div className="metric-foot"><span className="trend-warning">Needs attention</span><span> · medicines</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>Expiring soon</span><span className="metric-icon icon-purple"><Clock3 size={17} /></span></div><div className="metric-value">08</div><div className="metric-foot"><span className="trend-neutral">Next 60 days</span><span> · batches</span></div></article>
          </section>

          <section className="quick-section">
            <div className="section-heading"><div><h2>Quick actions</h2><p>Common tasks, just a click away</p></div><button className="text-action" onClick={() => navigate('Medicines')}>All actions <ArrowRight size={14} /></button></div>
            <div className="quick-grid">
              {quickActions.map(({ label, description, icon: Icon, tone, page }) => <button className={`quick-card quick-${tone}`} key={label} onClick={() => navigate(page)}><span className="quick-icon"><Icon size={18} /></span><span className="quick-copy"><strong>{label}</strong><small>{description}</small></span><span className="quick-arrow"><ArrowRight size={15} /></span></button>)}
            </div>
          </section>

          <section className="analytics-grid">
            <article className="panel inventory-panel">
              <div className="panel-heading"><div><h2>{activePage === 'Dashboard' ? 'Top medicines' : activePage}</h2><p>Inventory performance at a glance</p></div><button className="icon-button filter-button" aria-label="Search medicines"><Search size={16} /></button></div>
              <label className="inventory-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicines" /></label>
              <div className="inventory-table" role="table" aria-label="Medicine stock preview">
                <div className="table-header" role="row"><span>MEDICINE</span><span>STOCK LEVEL</span><span>UNITS</span></div>
                {filteredInventory.length ? filteredInventory.map((item) => <div className="medicine-row" role="row" key={item.name}><div className="medicine-name"><span className="medicine-avatar"><Pill size={15} /></span><span><strong>{item.name}</strong><small>{item.strength}</small></span></div><div className="stock-cell"><div className="stock-track"><span className={`stock-fill fill-${item.color}`} style={{ width: `${Math.min(item.stock / 10, 100)}%` }} /></div><small className={item.status === 'Low stock' ? 'stock-low' : 'stock-ok'}>{item.status}</small></div><strong className="units-count">{item.stock}</strong></div>) : <div className="empty-search">No medicines match “{search}”.</div>}
              </div>
              <button className="panel-footer-link" onClick={() => navigate('Medicines')}>View all medicines <ArrowRight size={14} /></button>
            </article>

            <article className="panel categories-panel">
              <div className="panel-heading"><div><h2>Medicine categories</h2><p>Stock distribution by category</p></div><button className="more-button" aria-label="Category options">···</button></div>
              <div className="chart-content"><div className="donut-chart"><div className="donut-hole"><strong>8,450</strong><span>total packs</span></div></div><div className="legend-list">{categoryData.map(({ label, count, color }) => <div className="legend-item" key={label}><span className="legend-label"><i style={{ backgroundColor: color }} />{label}</span><strong>{count}%</strong></div>)}</div></div>
              <div className="category-note"><span className="note-check"><Check size={12} /></span>Stock levels are looking healthy</div>
            </article>
          </section>

          <footer className="dashboard-footer"><span><span className="footer-status" /> Updated just now</span><span>Preview dashboard · {today}</span><button onClick={() => navigate('Alerts')}>See stock alerts <ChevronRight size={13} /></button></footer>
        </div>
      </main>

      <div className="preview-notice"><Sparkles size={13} /><span>Dashboard preview</span><button aria-label="Dismiss preview notice" onClick={(event) => event.currentTarget.parentElement?.remove()}><X size={13} /></button></div>
    </div>
  );
}
