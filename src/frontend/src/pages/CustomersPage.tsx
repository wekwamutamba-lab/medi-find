import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UserPlus, X } from 'lucide-react';
import { createCustomer, deleteCustomer, getCustomers, getSales, type ContactRecord, type SaleRecord } from '../api';
import { formatCurrency } from '../lib/dashboardMetrics';

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<ContactRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ContactRecord | null>(null);

  const refresh = async () => {
    const [customerRows, saleRows] = await Promise.all([getCustomers(), getSales()]);
    setCustomers(customerRows);
    setSales(saleRows);
  };

  useEffect(() => {
    let active = true;
    void refresh().catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load customer records.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setIsModalOpen(searchParams.get('action') === 'new');
  }, [searchParams]);

  const closeModal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set('action', 'new');
    setSearchParams(next, { replace: true });
  };

  const filteredCustomers = useMemo(() => customers.filter((customer) => `${customer.name} ${customer.email ?? ''} ${customer.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const customerSales = selectedCustomer ? sales.filter((sale) => (sale as SaleRecord & { customer_id?: string }).customer_id === selectedCustomer.id) : [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await createCustomer({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null });
      await refresh();
      setName(''); setEmail(''); setPhone(''); closeModal(); setNotice(`${name.trim()} added successfully.`);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not save customer.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (customer: ContactRecord) => {
    if (!window.confirm(`Remove ${customer.name}? Customers with sales history are retained.`)) return;
    try { await deleteCustomer(customer.id); await refresh(); setSelectedCustomer(null); setNotice(`${customer.name} removed from the registry.`); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Could not remove customer.'); }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> customer records</span></div>
          <h1>Customers</h1>
          <p className="page-subtitle">Manage pharmacy contacts and view their purchase history.</p>
        </div>
        <button type="button" className="export-button" onClick={openModal}><UserPlus size={14} /> New Customer</button>
      </div>

      {notice && <div role="status" className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button type="button" aria-label="Dismiss message" className="cursor-pointer" onClick={() => setNotice('')}>×</button></div>}
      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="metric-card"><div className="metric-top"><span>Registered customers</span></div><div className="metric-value">{customers.length}</div></div><div className="metric-card"><div className="metric-top"><span>Customer purchases</span></div><div className="metric-value">{sales.filter((sale) => (sale as SaleRecord & { customer_id?: string }).customer_id).length}</div></div><div className="metric-card"><div className="metric-top"><span>Customer revenue</span></div><div className="metric-value">{formatCurrency(sales.filter((sale) => (sale as SaleRecord & { customer_id?: string }).customer_id).reduce((sum, sale) => sum + Number(sale.total_amount), 0))}</div></div></div>

      <section className="panel"><div className="panel-heading"><div><h2>Customer registry</h2><p>Select a customer to review their purchase history</p></div><label className="contact-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" /></label></div>
        {loading ? <p className="pos-empty">Loading customers…</p> : filteredCustomers.length ? <div className="contact-list">{filteredCustomers.map((customer) => <article key={customer.id} className="contact-row"><button type="button" className="contact-main" onClick={() => setSelectedCustomer(customer)}><span className="contact-avatar">{customer.name.slice(0, 1).toUpperCase()}</span><span><strong>{customer.name}</strong><small>{customer.email || customer.phone || 'No contact details'}</small></span></button><span className="contact-purchases">{sales.filter((sale) => (sale as SaleRecord & { customer_id?: string }).customer_id === customer.id).length} purchases</span><button type="button" className="contact-delete" onClick={() => void handleDelete(customer)}>Remove</button></article>)}</div> : <div className="pos-empty">No customers found. Add your first customer profile.</div>}
      </section>

      {selectedCustomer && <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedCustomer(null)}><section role="dialog" aria-modal="true" aria-labelledby="customer-history-title" className="header-dialog"><div className="header-dialog-title"><div><span className="eyebrow">Purchase history</span><h2 id="customer-history-title">{selectedCustomer.name}</h2></div><button type="button" className="icon-button" aria-label="Close history" onClick={() => setSelectedCustomer(null)}><X size={15} /></button></div><p className="mt-3 text-sm text-slate-500">{selectedCustomer.email || 'No email'} · {selectedCustomer.phone || 'No phone'}</p>{customerSales.length ? <div className="mt-3 max-h-72 overflow-y-auto">{customerSales.map((sale) => <div key={sale.id} className="flex justify-between gap-4 border-t border-slate-100 py-3 text-sm"><span>{new Date(sale.created_at).toLocaleString()}</span><strong>{formatCurrency(Number(sale.total_amount))}</strong></div>)}</div> : <p className="pos-empty">No purchases recorded for this customer yet.</p>}</section></div>}

      <div className="quick-grid">
        <div className="quick-card quick-blue">
          <div className="quick-copy">
            <strong>Repeat customers</strong>
            <small>593 this month</small>
          </div>
        </div>
        <div className="quick-card quick-teal">
          <div className="quick-copy">
            <strong>Prescription pickups</strong>
            <small>86 pending</small>
          </div>
        </div>
        <div className="quick-card quick-purple">
          <div className="quick-copy">
            <strong>Customer satisfaction</strong>
            <small>96.2% positive</small>
          </div>
        </div>
      </div>

      {customers.length > 0 && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-800">New customer profiles</h2><p className="mt-1 text-xs text-slate-500">Added during this session.</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{customers.length}</span></div>
        <div className="divide-y divide-slate-100">{customers.map((customer) => <div key={customer.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><strong className="text-slate-800">{customer.name}</strong><span className="text-slate-500">{customer.email || 'No email'} · {customer.phone || 'No phone'}</span></div>)}</div>
      </section>}

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
        <section role="dialog" aria-modal="true" aria-labelledby="new-customer-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="new-customer-title" className="text-xl font-bold text-slate-900">New Customer Profile</h2><p className="mt-1 text-sm text-slate-500">Add basic contact details for this customer.</p></div><button type="button" className="icon-button" aria-label="Close customer form" onClick={closeModal}><X size={15} /></button></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Full name<input required autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="Customer name" /></label>
            <label className="block text-sm font-medium text-slate-700">Email (optional)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="name@example.com" /></label>
            <label className="block text-sm font-medium text-slate-700">Phone (optional)<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="Phone number" /></label>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create Profile'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
