import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowDownUp, ArrowRight, Bell, Boxes, CalendarDays, Check,
  ChevronDown, ChevronLeft, CircleHelp, Clock3, LayoutDashboard, LogOut, Menu, PackagePlus,
  Pill, Plus, Search, Settings2, ShieldAlert, Sparkles, Truck, UsersRound, X,
} from 'lucide-react';
import {
  AlertSettings, ApiError, AttentionSummary, authConfigured, Batch, getAllBatches, getMedicines,
  getMovements, getProfile, Medicine, Movement, Profile, readSession, request, signIn, signOut, signUp,
} from './api';

type Page = 'Dashboard' | 'Medicines' | 'Batches & expiry' | 'Stock movements' | 'Suppliers' | 'Alerts' | 'AI assistant' | 'Settings';
const navGroups = [
  { items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'Inventory', items: [{ label: 'Medicines', icon: Pill }, { label: 'Batches & expiry', icon: Boxes }, { label: 'Stock movements', icon: ArrowDownUp }, { label: 'Suppliers', icon: Truck }] },
  { title: 'Operations', items: [{ label: 'Alerts', icon: Bell }, { label: 'AI assistant', icon: Sparkles }] },
] as const;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
function day(value?: string) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function dateTime(value?: string) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}
function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}
function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function Sidebar({ activePage, profile, onNavigate, onClose, onSignOut }: { activePage: Page; profile: Profile; onNavigate: (page: Page) => void; onClose?: () => void; onSignOut: () => void }) {
  return <>
    <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); onNavigate('Dashboard'); onClose?.(); }}><span className="brand-mark"><span>m</span></span><span className="brand-name">MediFind<span className="brand-ai">AI</span></span><span className="sidebar-collapse"><ChevronLeft size={16} /></span></a>
    <nav className="side-nav" aria-label="Main navigation">{navGroups.map((group) => <div className="nav-group" key={group.title ?? 'home'}>{'title' in group && <p className="nav-heading">{group.title}</p>}{group.items.map(({ label, icon: Icon }) => <button className={`nav-link ${activePage === label ? 'active' : ''}`} key={label} type="button" onClick={() => { onNavigate(label); onClose?.(); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === 'Alerts' && <span className="nav-count">!</span>}</button>)}</div>)}</nav>
    <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><div><strong>Need a hand?</strong><span>Ask the inventory assistant</span></div><ArrowRight size={15} /></div><button className={`nav-link settings-link ${activePage === 'Settings' ? 'active' : ''}`} type="button" onClick={() => { onNavigate('Settings'); onClose?.(); }}><Settings2 size={17} /><span>Settings</span></button><div className="sidebar-user"><div className="avatar avatar-small">{(profile.full_name || 'U').slice(0, 1).toUpperCase()}</div><div className="sidebar-user-copy"><strong>{profile.full_name || 'User'}</strong><span>{profile.role}</span></div><button className="icon-button signout-button" title="Sign out" onClick={onSignOut}><LogOut size={14} /></button></div></div>
  </>;
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const signedIn = await signUp(form.fullName, form.email, form.password);
        if (!signedIn) { setMessage('Account created. Check your email to confirm, then sign in.'); setMode('signin'); return; }
      } else await signIn(form.email, form.password);
      onAuthenticated();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  };
  return <main className="auth-screen"><form className="auth-card" onSubmit={submit}><div className="brand auth-brand"><span className="brand-mark"><span>m</span></span><span className="brand-name">MediFind<span className="brand-ai">AI</span></span></div><span className="eyebrow">PHARMACY INVENTORY</span><h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1><p className="page-subtitle">{mode === 'signin' ? 'Sign in to manage your pharmacy inventory.' : 'Create a pharmacist account to get started.'}</p>{mode === 'signup' && <label className="form-field">Full name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" /></label>}<label className="form-field">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label><label className="form-field">Password<input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>{message && <div className="inline-message" role="alert">{message}</div>}<button className="primary-button full-button" disabled={busy || !authConfigured}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>{!authConfigured && <div className="inline-message">Authentication is not configured. Add the public Supabase URL and anon key to the frontend environment.</div>}<p className="auth-switch">{mode === 'signin' ? 'New to MediFind?' : 'Already registered?'} <button type="button" onClick={() => { setMessage(''); setMode(mode === 'signin' ? 'signup' : 'signin'); }}>{mode === 'signin' ? 'Create account' : 'Sign in'}</button></p></form></main>;
}

function Loading({ label = 'Loading inventory…' }: { label?: string }) { return <div className="loading-state"><span className="loading-spinner" />{label}</div>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span className="empty-icon"><Boxes size={20} /></span><strong>{title}</strong><span>{text}</span></div>; }

export default function App() {
  const [authenticated] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [dataVersion, setDataVersion] = useState(0);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [summary, setSummary] = useState<AttentionSummary | null>(null);
  const [settings, setSettings] = useState<AlertSettings>({ expiry_warning_days: 60 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'medicine' | 'batch' | 'movement' | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [settingsDays, setSettingsDays] = useState('60');
  const [showInactive, setShowInactive] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);

  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3500); }, []);
  const navigate = (page: Page) => { setActivePage(page); setSearch(''); setLoadError(''); };
  const refresh = useCallback(() => setDataVersion((version) => version + 1), []);

  useEffect(() => {
    if (!authenticated) { setProfile(null); return; }
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      console.warn('Profile fetch timed out; keeping user signed in.');
      setLoadError('Profile check timed out. Please retry.');
    }, 8000);
    getProfile()
      .then((result) => { if (!cancelled) setProfile(result); })
      .catch((error) => { if (!cancelled) setLoadError(errorMessage(error)); })
      .finally(() => { if (!cancelled) window.clearTimeout(timeout); });
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || !profile) return;
    let cancelled = false;
    setLoading(true); setLoadError('');
    const load = async () => {
      try {
        const medicineData = await getMedicines({ includeInactive: showInactive, limit: 100 });
        const [batchData, movementData, attention] = await Promise.all([
          getAllBatches(), getMovements(), request<AttentionSummary>('/alerts/summary'),
        ]);
        if (cancelled) return;
        setMedicines(medicineData.items); setBatches(batchData); setMovements(movementData.items); setSummary(attention);
        if (profile.role === 'admin') {
          try { const alertSettings = await request<AlertSettings>('/alerts/settings'); if (!cancelled) { setSettings(alertSettings); setSettingsDays(String(alertSettings.expiry_warning_days)); } } catch { /* settings are only shown to admins */ }
        }
      } catch (error) { if (!cancelled) setLoadError(errorMessage(error)); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [authenticated, profile, dataVersion, showInactive]);

  const visibleMedicines = useMemo(() => medicines.filter((medicine) => `${medicine.name} ${medicine.strength} ${medicine.dosage_form}`.toLowerCase().includes(search.toLowerCase())), [medicines, search]);
  const visibleBatches = useMemo(() => batches.filter((batch) => `${batch.medicine_name} ${batch.strength} ${batch.batch_number}`.toLowerCase().includes(search.toLowerCase())), [batches, search]);
  const visibleMovements = useMemo(() => movements.filter((movement) => `${movement.medicine_name} ${movement.batch_number} ${movement.movement_type} ${movement.reason}`.toLowerCase().includes(search.toLowerCase())), [movements, search]);
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  const openBatch = (medicineId = '') => { setSelectedMedicine(medicineId || medicines.find((medicine) => medicine.is_active)?.id || ''); setModal('batch'); };
  const openMovement = (batchId = '') => { setSelectedBatch(batchId || batches.find((batch) => batch.quantity_packs > 0)?.id || ''); setModal('movement'); };
  const saveMedicine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setModalBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await request('/medicines', { method: 'POST', body: JSON.stringify({ ...data, pack_size: Number(data.pack_size), reorder_level: Number(data.reorder_level) }) }); setModal(null); notify('Medicine added to the catalog.'); refresh(); }
    catch (error) { notify(errorMessage(error)); } finally { setModalBusy(false); }
  };
  const saveBatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setModalBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await request(`/medicines/${selectedMedicine}/batches`, { method: 'POST', body: JSON.stringify({ ...data, quantity_packs: Number(data.quantity_packs) }) }); setModal(null); notify('Batch saved and opening stock recorded.'); refresh(); }
    catch (error) { notify(errorMessage(error)); } finally { setModalBusy(false); }
  };
  const saveMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setModalBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const quantity = Number(data.quantity_packs);
    const signedQuantity = data.movement_type === 'issue' ? -Math.abs(quantity) : data.movement_type === 'receipt' ? Math.abs(quantity) : quantity;
    try { await request(`/batches/${selectedBatch}/movements`, { method: 'POST', body: JSON.stringify({ movement_type: data.movement_type, quantity_packs: signedQuantity, reason: data.reason || undefined }) }); setModal(null); notify('Stock movement recorded.'); refresh(); }
    catch (error) { notify(errorMessage(error)); } finally { setModalBusy(false); }
  };
  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    try { const updated = await request<AlertSettings>('/alerts/settings', { method: 'PATCH', body: JSON.stringify({ expiry_warning_days: Number(settingsDays) }) }); setSettings(updated); notify('Alert settings saved.'); refresh(); }
    catch (error) { notify(errorMessage(error)); }
  };
  const askAssistant = async (event: FormEvent) => {
    event.preventDefault(); if (!aiQuestion.trim()) return;
    setAiBusy(true); setAiAnswer('');
    try { const result = await request<{ answer: string }>('/ai/ask', { method: 'POST', body: JSON.stringify({ question: aiQuestion.trim() }) }); setAiAnswer(result.answer); }
    catch (error) { setAiAnswer(errorMessage(error)); } finally { setAiBusy(false); }
  };
  const exportCurrent = () => {
    if (activePage === 'Medicines' || activePage === 'Dashboard') downloadCsv('medifind-medicines.csv', [['Medicine', 'Strength', 'Form', 'Pack size', 'Usable stock', 'Reorder level', 'Status'], ...medicines.map((item) => [item.name, item.strength, item.dosage_form, item.pack_size, item.usable_stock ?? 0, item.reorder_level, item.is_active ? 'Active' : 'Inactive'])]);
    else if (activePage === 'Batches & expiry') downloadCsv('medifind-batches.csv', [['Medicine', 'Strength', 'Batch', 'Expiry', 'Packs'], ...batches.map((item) => [item.medicine_name, item.strength, item.batch_number, item.expiry_date, item.quantity_packs])]);
    else downloadCsv('medifind-movements.csv', [['Medicine', 'Batch', 'Type', 'Quantity', 'Reason', 'Date'], ...movements.map((item) => [item.medicine_name, item.batch_number, item.movement_type, item.quantity_packs, item.reason, item.created_at])]);
  };
  const doSignOut = () => { signOut(); setAuthenticated(false); setProfile(null); setActivePage('Dashboard'); };

  if (!authenticated) return null;
  if (!profile) return null;

  const pageSubtitle: Record<Page, string> = {
    Dashboard: 'A live view of stock, expiry and work needing attention.', Medicines: 'Manage your medicine catalog, reorder levels and active items.',
    'Batches & expiry': 'Review batch quantities and expiry dates across your catalog.', 'Stock movements': 'Audit receipts, issues and stock adjustments.',
    Suppliers: 'Supplier records are not part of this inventory API yet.', Alerts: 'Review low stock, approaching expiry and missing inventory data.',
    'AI assistant': 'Ask questions about your inventory. The assistant is read-only.', Settings: 'Configure expiry alerts for your pharmacy.',
  };
  const alertCount = summary ? summary.low_stock.count + summary.expiring.count + summary.expired.count + summary.missing_data.count : 0;
  const isExpired = (expiry: string) => new Date(`${expiry.slice(0, 10)}T00:00:00`) < new Date(new Date().toDateString());
  const topMedicines = medicines.filter((medicine) => medicine.is_active).slice(0, 5);

  return <div className="app-shell">
    {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}><Sidebar activePage={activePage} profile={profile} onNavigate={navigate} onClose={() => setMobileNavOpen(false)} onSignOut={doSignOut} /></aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button><div className="location-mark"><Plus size={16} strokeWidth={3} /></div><div className="location-copy"><strong>Healthcare Pharmacy</strong><span><span className="location-dot" /> Connected inventory</span></div></div><div className="topbar-actions"><div className="date-pill"><CalendarDays size={15} /><span>{today}</span></div><div className="notification-wrap"><button className={`icon-button notification-button ${notificationsOpen ? 'selected' : ''}`} aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} />{alertCount > 0 && <span className="notification-dot" />}</button>{notificationsOpen && <div className="notification-popover"><div className="popover-title"><strong>Attention summary</strong><span>{alertCount} item{alertCount === 1 ? '' : 's'}</span></div>{summary?.low_stock.count ? <div className="notification-item"><span className="notice-symbol notice-red"><ShieldAlert size={15} /></span><span><strong>{summary.low_stock.count} low-stock medicine{summary.low_stock.count === 1 ? '' : 's'}</strong><small>Usable stock is below the reorder level.</small></span></div> : null}{summary?.expiring.count ? <div className="notification-item"><span className="notice-symbol notice-amber"><Clock3 size={15} /></span><span><strong>{summary.expiring.count} batches expiring soon</strong><small>Within {summary.expiring.window_days} days.</small></span></div> : null}<button className="view-alerts" onClick={() => { navigate('Alerts'); setNotificationsOpen(false); }}>Review alerts <ArrowRight size={14} /></button></div>}</div><button className="profile-pill" type="button" onClick={doSignOut} title="Sign out"><span className="avatar">{profile.full_name.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{profile.full_name}</strong><small>{profile.role}</small></span><ChevronDown size={15} /></button></div></header>
      <div className="page-content">
        <div className="page-heading-row"><div><div className="eyebrow">PHARMACY INVENTORY <span className="connection-badge"><span /> Live data</span></div><h1>{activePage}</h1><p className="page-subtitle">{pageSubtitle[activePage]}</p></div><div className="heading-tools">{activePage !== 'AI assistant' && activePage !== 'Settings' && activePage !== 'Suppliers' && <button className="export-button" onClick={exportCurrent}><ArrowDownToLine size={15} />Export CSV</button>}</div></div>
        {loadError && <div className="error-banner" role="alert"><ShieldAlert size={16} /><span>{loadError}</span><button onClick={refresh}>Retry</button></div>}
        {loading && !summary ? <Loading /> : <>
          {activePage === 'Dashboard' && <>
            <section className="metrics-grid" aria-label="Pharmacy summary"><article className="metric-card"><div className="metric-top"><span>Active medicines</span><span className="metric-icon icon-blue"><Pill size={17} /></span></div><div className="metric-value">{medicines.filter((item) => item.is_active).length}</div><div className="metric-foot">Registered in catalog</div></article><article className="metric-card"><div className="metric-top"><span>Usable stock</span><span className="metric-icon icon-teal"><Boxes size={17} /></span></div><div className="metric-value">{medicines.reduce((sum, item) => sum + Number(item.usable_stock || 0), 0).toLocaleString()}</div><div className="metric-foot">Packs in non-expired batches</div></article><article className="metric-card"><div className="metric-top"><span>Low stock</span><span className="metric-icon icon-amber"><Activity size={17} /></span></div><div className="metric-value">{summary?.low_stock.count ?? '—'}</div><div className="metric-foot"><span className="trend-warning">Below reorder level</span></div></article><article className="metric-card"><div className="metric-top"><span>Expiring soon</span><span className="metric-icon icon-purple"><Clock3 size={17} /></span></div><div className="metric-value">{summary?.expiring.count ?? '—'}</div><div className="metric-foot">Next {summary?.expiring.window_days ?? settings.expiry_warning_days} days</div></article></section>
            <section className="quick-section"><div className="section-heading"><div><h2>Quick actions</h2><p>Common inventory tasks</p></div></div><div className="quick-grid"><button className="quick-card quick-blue" onClick={() => setModal('medicine')}><span className="quick-icon"><Pill size={18} /></span><span className="quick-copy"><strong>Add medicine</strong><small>Add a medicine to the catalog</small></span><span className="quick-arrow"><ArrowRight size={15} /></span></button><button className="quick-card quick-teal" onClick={() => openBatch()}><span className="quick-icon"><PackagePlus size={18} /></span><span className="quick-copy"><strong>Receive stock</strong><small>Create a batch and opening stock</small></span><span className="quick-arrow"><ArrowRight size={15} /></span></button><button className="quick-card quick-purple" onClick={() => openMovement()}><span className="quick-icon"><ArrowDownUp size={18} /></span><span className="quick-copy"><strong>Record movement</strong><small>Issue or adjust inventory</small></span><span className="quick-arrow"><ArrowRight size={15} /></span></button><button className="quick-card quick-sky" onClick={() => navigate('Alerts')}><span className="quick-icon"><ShieldAlert size={18} /></span><span className="quick-copy"><strong>Review alerts</strong><small>{alertCount} inventory items to review</small></span><span className="quick-arrow"><ArrowRight size={15} /></span></button></div></section>
            <section className="analytics-grid"><article className="panel inventory-panel"><div className="panel-heading"><div><h2>Medicine stock</h2><p>Current usable quantity and reorder level</p></div><button className="icon-button" aria-label="View medicines" onClick={() => navigate('Medicines')}><ArrowRight size={15} /></button></div>{topMedicines.length ? <div className="data-table"><div className="table-header table-medicine"><span>MEDICINE</span><span>USABLE STOCK</span><span>REORDER</span></div>{topMedicines.map((medicine) => <div className="data-row table-medicine" key={medicine.id}><div className="medicine-name"><span className="medicine-avatar"><Pill size={15} /></span><span><strong>{medicine.name}</strong><small>{medicine.strength} · {medicine.dosage_form}</small></span></div><strong>{medicine.usable_stock ?? 0} packs</strong><span>{medicine.reorder_level}</span></div>)}</div> : <Empty title="No medicines yet" text="Add a medicine to start tracking stock." />}<button className="panel-footer-link" onClick={() => navigate('Medicines')}>View medicine catalog <ArrowRight size={14} /></button></article><article className="panel"><div className="panel-heading"><div><h2>Needs attention</h2><p>Live inventory alerts</p></div><button className="icon-button" aria-label="View alerts" onClick={() => navigate('Alerts')}><ArrowRight size={15} /></button></div><div className="attention-list"><button onClick={() => navigate('Alerts')}><span className="notice-symbol notice-red"><ShieldAlert size={15} /></span><span><strong>Low stock</strong><small>Below medicine reorder levels</small></span><b>{summary?.low_stock.count ?? 0}</b></button><button onClick={() => navigate('Batches & expiry')}><span className="notice-symbol notice-amber"><Clock3 size={15} /></span><span><strong>Expiring soon</strong><small>Within {summary?.expiring.window_days ?? 60} days</small></span><b>{summary?.expiring.count ?? 0}</b></button><button onClick={() => navigate('Batches & expiry')}><span className="notice-symbol notice-red"><X size={15} /></span><span><strong>Expired with stock</strong><small>Remove from usable stock</small></span><b>{summary?.expired.count ?? 0}</b></button><button onClick={() => navigate('Alerts')}><span className="notice-symbol notice-amber"><CircleHelp size={15} /></span><span><strong>Missing data</strong><small>No batches or reorder level</small></span><b>{summary?.missing_data.count ?? 0}</b></button></div></article></section>
          </>}

          {activePage === 'Medicines' && <section className="panel full-panel"><div className="toolbar-row"><label className="inventory-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, strength or form" /></label><label className="toggle-control"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Include inactive</label><button className="primary-button" onClick={() => setModal('medicine')}><Plus size={15} />Add medicine</button></div>{visibleMedicines.length ? <div className="data-table wide-table"><div className="table-header medicines-columns"><span>MEDICINE</span><span>FORM / PACK</span><span>USABLE STOCK</span><span>REORDER</span><span>STATUS</span><span>ACTIONS</span></div>{visibleMedicines.map((medicine) => <div className="data-row medicines-columns" key={medicine.id}><div className="medicine-name"><span className="medicine-avatar"><Pill size={15} /></span><span><strong>{medicine.name}</strong><small>{medicine.strength}</small></span></div><span>{medicine.dosage_form} · {medicine.pack_size}/pack</span><strong>{medicine.usable_stock ?? 0}</strong><span>{medicine.reorder_level}</span><span className={`status-pill ${medicine.is_active ? 'status-active' : 'status-inactive'}`}>{medicine.is_active ? 'Active' : 'Inactive'}</span><div className="row-actions"><button onClick={() => openBatch(medicine.id)} disabled={!medicine.is_active}>Add batch</button>{profile.role === 'admin' && <button className="danger-action" onClick={async () => { if (!window.confirm(`Remove ${medicine.name} from the active catalog?`)) return; try { await request(`/medicines/${medicine.id}`, { method: 'DELETE' }); notify('Medicine removed from the active catalog.'); refresh(); } catch (error) { notify(errorMessage(error)); } }}>Remove</button>}</div></div>)}</div> : <Empty title="No matching medicines" text={search ? 'Try another search.' : 'Add your first medicine to the catalog.'} />}</section>}

          {activePage === 'Batches & expiry' && <section className="panel full-panel"><div className="toolbar-row"><label className="inventory-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine or batch" /></label><button className="primary-button" onClick={() => openBatch()} disabled={!medicines.some((medicine) => medicine.is_active)}><Plus size={15} />Add batch</button></div><div className="alert-summary-strip"><span><b>{summary?.expiring.count ?? 0}</b> expiring within {summary?.expiring.window_days ?? 60} days</span><span><b>{summary?.expired.count ?? 0}</b> expired with stock</span></div>{visibleBatches.length ? <div className="data-table wide-table"><div className="table-header batches-columns"><span>MEDICINE</span><span>BATCH</span><span>EXPIRY DATE</span><span>QUANTITY</span><span>STATUS</span><span>ACTION</span></div>{visibleBatches.map((batch) => { const expired = isExpired(batch.expiry_date); const soon = !expired && (new Date(`${batch.expiry_date.slice(0, 10)}T00:00:00`).getTime() - Date.now()) / 86400000 <= (summary?.expiring.window_days ?? 60); return <div className="data-row batches-columns" key={batch.id}><div className="medicine-name"><span className="medicine-avatar"><Boxes size={15} /></span><span><strong>{batch.medicine_name}</strong><small>{batch.strength}</small></span></div><span>{batch.batch_number}</span><span>{day(batch.expiry_date)}</span><strong>{batch.quantity_packs} packs</strong><span className={`status-pill ${expired ? 'status-danger' : soon ? 'status-warning' : 'status-active'}`}>{expired ? 'Expired' : soon ? 'Expiring soon' : 'Good'}</span><button className="row-action-button" onClick={() => openMovement(batch.id)}>Record movement</button></div>; })}</div> : <Empty title="No batches found" text="Create a batch for a medicine to record its expiry and stock." />}</section>}

          {activePage === 'Stock movements' && <section className="panel full-panel"><div className="toolbar-row"><label className="inventory-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine, batch or movement" /></label><button className="primary-button" onClick={() => openMovement()} disabled={!batches.length}><Plus size={15} />Record movement</button></div>{visibleMovements.length ? <div className="data-table wide-table"><div className="table-header movements-columns"><span>DATE</span><span>MEDICINE / BATCH</span><span>TYPE</span><span>QUANTITY</span><span>REASON</span></div>{visibleMovements.map((movement) => <div className="data-row movements-columns" key={movement.id}><span>{dateTime(movement.created_at)}</span><div className="medicine-name"><span className="medicine-avatar"><Pill size={15} /></span><span><strong>{movement.medicine_name}</strong><small>Batch {movement.batch_number} · {movement.strength}</small></span></div><span className={`movement-type movement-${movement.movement_type}`}>{movement.movement_type}</span><strong className={movement.quantity_packs < 0 ? 'quantity-negative' : 'quantity-positive'}>{movement.quantity_packs > 0 ? '+' : ''}{movement.quantity_packs} packs</strong><span className="reason-cell">{movement.reason || '—'}</span></div>)}</div> : <Empty title="No movements found" text="Stock receipts, issues and adjustments will appear here." />}</section>}

          {activePage === 'Alerts' && <div className="alert-page-grid">{[
            { key: 'Low stock', count: summary?.low_stock.count ?? 0, icon: Activity, tone: 'red', description: 'Usable quantity is below the reorder level.', rows: summary?.low_stock.items.map((item) => ({ id: item.id, name: item.name, detail: `${item.strength} · ${item.usable_stock} packs in stock`, extra: `Reorder at ${item.reorder_level}`, onClick: () => navigate('Medicines') })) ?? [] },
            { key: 'Expiring soon', count: summary?.expiring.count ?? 0, icon: Clock3, tone: 'amber', description: `Batch expiry within ${summary?.expiring.window_days ?? 60} days.`, rows: summary?.expiring.items.map((item) => ({ id: item.id, name: item.medicine_name || 'Medicine', detail: `Batch ${item.batch_number} · ${day(item.expiry_date)}`, extra: `${item.quantity_packs} packs`, onClick: () => navigate('Batches & expiry') })) ?? [] },
            { key: 'Expired with stock', count: summary?.expired.count ?? 0, icon: ShieldAlert, tone: 'red', description: 'Expired stock is excluded from usable inventory.', rows: summary?.expired.items.map((item) => ({ id: item.id, name: item.medicine_name || 'Medicine', detail: `Batch ${item.batch_number} · expired ${day(item.expiry_date)}`, extra: `${item.quantity_packs} packs`, onClick: () => navigate('Batches & expiry') })) ?? [] },
            { key: 'Missing data', count: summary?.missing_data.count ?? 0, icon: CircleHelp, tone: 'amber', description: 'Active medicines with no batch or a zero reorder level.', rows: summary?.missing_data.items.map((item) => ({ id: item.id, name: item.name, detail: `${item.strength} · ${item.batch_count} batches`, extra: item.reorder_level === 0 ? 'Set a reorder level' : 'Add a batch', onClick: () => item.batch_count === 0 ? openBatch(item.id) : navigate('Medicines') })) ?? [],
          }].map(({ key, count, icon: Icon, tone, description, rows }) => <section className="panel alert-card" key={key}><div className="alert-card-title"><span className={`metric-icon ${tone === 'red' ? 'icon-alert-red' : 'icon-amber'}`}><Icon size={17} /></span><div><h2>{key}</h2><p>{description}</p></div><b>{count}</b></div>{rows.length ? <div className="alert-rows">{rows.map((row) => <button key={row.id} onClick={row.onClick}><span><strong>{row.name}</strong><small>{row.detail}</small></span><span className="alert-row-extra">{row.extra}<ArrowRight size={13} /></span></button>)}</div> : <div className="healthy-state"><Check size={14} />No {key.toLowerCase()} to review</div>}</section>)}</div>}

          {activePage === 'AI assistant' && <section className="panel assistant-panel"><div className="assistant-welcome"><span className="assistant-icon"><Sparkles size={21} /></span><div><h2>Inventory assistant</h2><p>Ask questions about stock, batches and attention items.</p></div></div><div className="suggestion-list"><span>Try asking</span>{['Which medicines are below reorder level?', 'What batches expire in the next 30 days?', 'Summarize today’s inventory alerts'].map((question) => <button key={question} onClick={() => setAiQuestion(question)}>{question}<ArrowRight size={14} /></button>)}</div>{aiAnswer && <div className="assistant-answer"><strong>Assistant response</strong><p>{aiAnswer}</p></div>}<form className="assistant-form" onSubmit={askAssistant}><textarea value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} maxLength={500} placeholder="Ask about your pharmacy inventory…" rows={3} /><div><small>Inventory queries only · No clinical advice</small><button className="primary-button" disabled={aiBusy || !aiQuestion.trim()}>{aiBusy ? 'Checking…' : 'Ask assistant'}<ArrowRight size={15} /></button></div></form></section>}

          {activePage === 'Settings' && <section className="panel settings-panel"><div className="panel-heading"><div><h2>Expiry alerts</h2><p>Choose how far ahead batches should be flagged.</p></div><span className="metric-icon icon-purple"><Settings2 size={17} /></span></div>{profile.role === 'admin' ? <form className="settings-form" onSubmit={saveSettings}><label className="form-field">Expiry warning window (days)<input type="number" min="1" max="365" required value={settingsDays} onChange={(event) => setSettingsDays(event.target.value)} /><small>Current setting: {settings.expiry_warning_days} days. Allowed range: 1–365.</small></label><button className="primary-button">Save settings</button></form> : <div className="inline-message">Only an administrator can update alert settings.</div>}<div className="settings-note"><ShieldAlert size={16} /><span>Expired batches are excluded from usable stock calculations, but remain visible in alerts when quantity is on hand.</span></div></section>}

          {activePage === 'Suppliers' && <section className="panel supplier-placeholder"><span className="empty-icon"><Truck size={20} /></span><h2>Supplier management isn’t available yet</h2><p>This project currently tracks medicines, batches, stock movements and alerts. There is no supplier data model or API, so this page is intentionally read-only rather than showing fake records.</p><button className="primary-button" onClick={() => navigate('Medicines')}>Open medicine catalog<ArrowRight size={15} /></button></section>}
        </>}
        <footer className="dashboard-footer"><span><span className="footer-status" /> Connected as {profile.role}</span><span>{today}</span><button onClick={() => { refresh(); notify('Refreshing inventory…'); }}>Refresh data <ArrowRight size={13} /></button></footer>
      </div>
    </main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">INVENTORY ACTION</span><h2 id="modal-title">{modal === 'medicine' ? 'Add medicine' : modal === 'batch' ? 'Add batch' : 'Record stock movement'}</h2></div><button className="icon-button" aria-label="Close" onClick={() => setModal(null)}><X size={17} /></button></div>
      {modal === 'medicine' && <form onSubmit={saveMedicine} className="modal-form"><label className="form-field">Medicine name<input name="name" required maxLength={200} placeholder="e.g. Paracetamol" /></label><div className="form-two"><label className="form-field">Strength<input name="strength" required maxLength={100} placeholder="500 mg" /></label><label className="form-field">Dosage form<input name="dosage_form" required maxLength={50} placeholder="Tablet" /></label></div><div className="form-two"><label className="form-field">Units per pack<input name="pack_size" type="number" required min="1" defaultValue="1" /></label><label className="form-field">Reorder level (packs)<input name="reorder_level" type="number" min="0" defaultValue="0" /></label></div><label className="form-field">Notes<textarea name="notes" maxLength={1000} rows={2} placeholder="Optional notes" /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={modalBusy}>{modalBusy ? 'Saving…' : 'Add medicine'}</button></div></form>}
      {modal === 'batch' && <form onSubmit={saveBatch} className="modal-form"><label className="form-field">Medicine<select value={selectedMedicine} onChange={(event) => setSelectedMedicine(event.target.value)} required>{medicines.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.strength}</option>)}</select></label><label className="form-field">Batch number<input name="batch_number" required maxLength={100} /></label><div className="form-two"><label className="form-field">Expiry date<input name="expiry_date" type="date" required /></label><label className="form-field">Opening quantity (packs)<input name="quantity_packs" type="number" min="0" required defaultValue="0" /></label></div><p className="field-note">A positive opening quantity also creates a receipt in stock history.</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={modalBusy || !selectedMedicine}>{modalBusy ? 'Saving…' : 'Create batch'}</button></div></form>}
      {modal === 'movement' && <form onSubmit={saveMovement} className="modal-form"><label className="form-field">Batch<select value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} required>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.medicine_name} · {batch.batch_number} ({batch.quantity_packs} packs)</option>)}</select></label><label className="form-field">Movement type<select name="movement_type" required><option value="receipt">Receipt — add packs</option><option value="issue">Issue — remove packs</option><option value="adjustment">Adjustment — signed quantity</option></select></label><label className="form-field">Quantity (packs)<input name="quantity_packs" type="number" required /></label><label className="form-field">Reason<input name="reason" maxLength={500} placeholder="Required for adjustments" /></label><p className="field-note">Enter a non-zero quantity. Adjustments can be positive or negative; an issue cannot reduce batch stock below zero.</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={modalBusy || !selectedBatch}>{modalBusy ? 'Saving…' : 'Record movement'}</button></div></form>}
    </section></div>}
    {toast && <div className="toast-message" role="status">{toast}<button aria-label="Dismiss message" onClick={() => setToast('')}><X size={14} /></button></div>}
  </div>;
}
