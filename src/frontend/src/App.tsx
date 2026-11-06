import { useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PackageCheck,
  PackageSearch,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { InventoryPage } from './pages/InventoryPage';
import { BatchesPage } from './pages/BatchesPage';
import { MovementsPage } from './pages/MovementsPage';
import { AiPage } from './pages/AiPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SalesPage } from './pages/SalesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ReportsPage } from './pages/ReportsPage';

const navGroups = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    heading: 'Inventory',
    items: [
      { label: 'Items Management', to: '/inventory', icon: PackageSearch },
      { label: 'Batches & Expiry', to: '/batches', icon: PackageCheck },
      { label: 'Stock Movements', to: '/movements', icon: ClipboardList },
    ],
  },
  {
    heading: 'Sales & Business',
    items: [
      { label: 'Sales & POS', to: '/sales', icon: ShoppingCart },
      { label: 'Customers', to: '/customers', icon: UserPlus },
      { label: 'Suppliers', to: '/suppliers', icon: Truck },
    ],
  },
  {
    heading: 'Reports',
    items: [
      { label: 'Performance Reports', to: '/reports', icon: TrendingUp },
    ],
  },
  {
    heading: 'AI',
    items: [{ label: 'AI Assistant', to: '/ai', icon: Sparkles }],
  },
];

function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand" aria-label="MediPulse home">
          <div className="brand-mark"><span>M</span></div>
          <div className="brand-name">MediPulse <span className="brand-ai">AI</span></div>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div key={group.heading} className="nav-group">
              <div className="nav-heading">{group.heading}</div>
              {group.items.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {label === 'Movements' && <span className="nav-count">12</span>}
                  {(label === 'Store' || label === 'Purchase' || label === 'Sales' || label === 'Customers' || label === 'Suppliers') && <ChevronDown size={12} className="nav-chevron" />}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Sparkles size={14} /></div>
            <div>
              <strong>AI stock review</strong>
              <span>3 insights available</span>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="avatar">JS</div>
            <div className="sidebar-user-copy">
              <strong>Jane Smith</strong>
              <span>Pharmacy Lead</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" type="button" aria-label="Open menu" onClick={() => setMobileMenuOpen((v) => !v)}>
              <Menu size={18} />
            </button>
            <div className="location-mark"><Truck size={14} /></div>
            <div className="location-copy">
              <strong>North Wing Pharmacy</strong>
              <span><span className="location-dot" /> Live stock view</span>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="date-pill"><CalendarDays size={12} /> <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            <div className="notification-wrap">
              <button className="icon-button" type="button" aria-label="Notifications">
                <Bell size={16} />
                <span className="notification-dot" />
              </button>
            </div>
            <button className="profile-pill" type="button" aria-label="Profile">
              <div className="avatar avatar-small">JS</div>
              <div className="profile-copy">
                <strong>Jane</strong>
                <small>On duty</small>
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai" element={<AiPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {mobileMenuOpen && <button type="button" className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />}
    </div>
  );
}

export default function App() {
  return <AppShell />;
}