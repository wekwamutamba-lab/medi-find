import { useEffect, useState, type FormEvent } from 'react';
import { Truck, X } from 'lucide-react';
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier, type ContactRecord } from '../api';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ContactRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRecord | null>(null);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => setSuppliers(await getSuppliers());
  useEffect(() => { let active = true; void getSuppliers().then((rows) => { if (active) setSuppliers(rows); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load suppliers.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const openNew = () => { setEditing(null); setName(''); setContactName(''); setEmail(''); setPhone(''); setAddress(''); setError(''); setIsModalOpen(true); };
  const openEdit = (supplier: ContactRecord) => { setEditing(supplier); setName(supplier.name); setContactName(supplier.contact_name || ''); setEmail(supplier.email || ''); setPhone(supplier.phone || ''); setAddress(supplier.address || ''); setError(''); setIsModalOpen(true); };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('');
    const data = { name: name.trim(), contact_name: contactName.trim() || null, email: email.trim() || null, phone: phone.trim() || null, address: address.trim() || null };
    try { if (editing) await updateSupplier(editing.id, data); else await createSupplier(data); await refresh(); setIsModalOpen(false); setNotice(editing ? 'Supplier updated.' : `${name.trim()} added to suppliers.`); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save supplier.'); }
    finally { setSaving(false); }
  };
  const archive = async (supplier: ContactRecord) => { if (!window.confirm(`Archive ${supplier.name}?`)) return; try { await deleteSupplier(supplier.id); await refresh(); setNotice(`${supplier.name} archived.`); } catch (archiveError) { setError(archiveError instanceof Error ? archiveError.message : 'Could not archive supplier.'); } };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row"><div><div className="eyebrow"><span className="preview-badge"><span /> supplier hub</span></div><h1>Supplier Management</h1><p className="page-subtitle">Manage vendor contacts and keep supplier information up to date.</p></div><button type="button" className="export-button" onClick={openNew}><Truck size={14} /> Add Supplier</button></div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{notice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="metric-card"><div className="metric-top"><span>Active suppliers</span></div><div className="metric-value">{suppliers.filter((supplier) => supplier.is_active !== false).length}</div></div><div className="metric-card"><div className="metric-top"><span>Contact records</span></div><div className="metric-value">{suppliers.length}</div></div><div className="metric-card"><div className="metric-top"><span>With email on file</span></div><div className="metric-value">{suppliers.filter((supplier) => supplier.email).length}</div></div></div>
      <section className="panel"><div className="panel-heading"><div><h2>Supplier directory</h2><p>Update contacts or archive inactive vendors</p></div></div>{loading ? <p className="pos-empty">Loading suppliers…</p> : suppliers.length ? <div className="contact-list">{suppliers.map((supplier) => <article key={supplier.id} className="contact-row"><span className="contact-avatar"><Truck size={15} /></span><span className="supplier-main"><strong>{supplier.name}</strong><small>{supplier.contact_name || 'No contact name'} · {supplier.email || supplier.phone || 'No contact details'}</small><small>{supplier.address || ''}</small></span><span className={`supplier-status ${supplier.is_active === false ? 'supplier-inactive' : ''}`}>{supplier.is_active === false ? 'Archived' : 'Active'}</span><button type="button" className="contact-edit" onClick={() => openEdit(supplier)}>Edit</button>{supplier.is_active !== false && <button type="button" className="contact-delete" onClick={() => void archive(supplier)}>Archive</button>}</article>)}</div> : <p className="pos-empty">No suppliers yet. Add your first vendor.</p>}</section>
      {isModalOpen && <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsModalOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="supplier-dialog-title" className="header-dialog"><div className="header-dialog-title"><div><span className="eyebrow">Supplier registry</span><h2 id="supplier-dialog-title">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2></div><button type="button" className="icon-button" aria-label="Close supplier form" onClick={() => setIsModalOpen(false)}><X size={15} /></button></div><form onSubmit={handleSubmit} className="mt-4 space-y-4"><label className="pos-field">Company name<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label className="pos-field">Contact name<input value={contactName} onChange={(event) => setContactName(event.target.value)} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="pos-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="pos-field">Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label></div><label className="pos-field">Address<input value={address} onChange={(event) => setAddress(event.target.value)} /></label><div className="dialog-actions"><button type="button" className="period-button" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" disabled={saving} className="pos-checkout-button !w-auto">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Supplier'}</button></div></form></section></div>}
    </div>
  );
}
