import { useState } from 'react';
import { Bell, ChevronRight, ClipboardList, Menu, PackageCheck, PackageSearch, Sparkles, Truck } from 'lucide-react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { InventoryPage } from './pages/InventoryPage';
import { BatchesPage } from './pages/BatchesPage';
import { MovementsPage } from './pages/MovementsPage';
import { AiPage } from './pages/AiPage';

const navItems = [
  { label: 'Inventory', to: '/inventory', icon: PackageSearch },
  { label: 'Batches', to: '/batches', icon: PackageCheck },
  { label: 'Movements', to: '/movements', icon: ClipboardList },
  { label: 'AI Assistant', to: '/ai', icon: Sparkles },
];

function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand" aria-label="MediFind AI home">
          <div className="brand-mark"><span>M</span></div>
          <div className="brand-name">MediFind <span className="brand-ai">AI</span></div>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <div className="nav-group">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={16} />
                <span>{label}</span>
                {label === 'Movements' && <span className="nav-count">12</span>}
              </NavLink>
            ))}
          </div>
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
            <div className="date-pill"><span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
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
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/ai" element={<AiPage />} />
            <Route path="*" element={<Navigate to="/inventory" replace />} />
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