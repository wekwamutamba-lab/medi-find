import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { completeSale, getCustomers, getMedicines, getSales, type ContactRecord, type Medicine, type SaleRecord } from '../api';
import { formatCurrency, getDashboardStats, dashboardRangeLabels, type DashboardRange } from '../lib/dashboardMetrics';

export function SalesPage({ dateRange, customDate }: { dateRange: DashboardRange; customDate: string }) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [customers, setCustomers] = useState<ContactRecord[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<SaleRecord['payment_method']>('cash');
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    const [medicineResult, salesResult, customerResult] = await Promise.all([getMedicines({ limit: 100 }), getSales(), getCustomers()]);
    setMedicines(medicineResult.items.filter((medicine) => medicine.is_active));
    setSales(salesResult);
    setCustomers(customerResult);
  };

  useEffect(() => {
    let active = true;
    void refresh().catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load point of sale.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleMedicines = useMemo(() => medicines.filter((medicine) => `${medicine.name} ${medicine.strength} ${medicine.category ?? ''}`.toLowerCase().includes(search.toLowerCase())), [medicines, search]);
  const cartItems = medicines.filter((medicine) => cart[medicine.id] > 0);
  const subtotal = cartItems.reduce((sum, medicine) => sum + Number(medicine.unit_price ?? 0) * cart[medicine.id], 0);
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;
  const stats = getDashboardStats(dateRange, customDate);
  const recentSales = sales.slice(0, 6);

  const updateQuantity = (medicine: Medicine, delta: number) => {
    setCart((current) => {
      const next = Math.max(0, Math.min(Number(medicine.usable_stock ?? 0), (current[medicine.id] ?? 0) + delta));
      const copy = { ...current };
      if (next === 0) delete copy[medicine.id]; else copy[medicine.id] = next;
      return copy;
    });
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cartItems.length || submitting) return;
    setSubmitting(true); setError(''); setNotice('');
    try {
      const sale = await completeSale({ customer_id: customerId || null, payment_method: paymentMethod, tax_rate: taxRate, items: cartItems.map((medicine) => ({ medicine_id: medicine.id, quantity_packs: cart[medicine.id] })) });
      setNotice(`Sale completed · ${formatCurrency(Number(sale.total_amount))}`);
      setCart({});
      await refresh();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Sale could not be completed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row"><div><div className="eyebrow"><span className="preview-badge"><span /> {dashboardRangeLabels[dateRange]} sales</span></div><h1>Point of Sale</h1><p className="page-subtitle">Build a cart, select payment, and complete an auditable sale.</p></div></div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="metric-card"><div className="metric-top"><span>Sales revenue</span></div><div className="metric-value">{formatCurrency(stats.sales)}</div><div className="metric-foot">{dashboardRangeLabels[dateRange]}</div></div>
        <div className="metric-card"><div className="metric-top"><span>Transactions</span></div><div className="metric-value">{sales.length || stats.transactions}</div><div className="metric-foot">Recorded sale receipts</div></div>
        <div className="metric-card"><div className="metric-top"><span>Avg. basket</span></div><div className="metric-value">{formatCurrency(sales.length ? sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0) / sales.length : stats.sales / Math.max(stats.transactions, 1))}</div><div className="metric-foot">Per transaction</div></div>
      </div>
      <div className="pos-layout">
        <section className="panel pos-catalog"><div className="panel-heading"><div><h2>Medicine catalog</h2><p>Select items to add them to checkout</p></div><span className="pos-count">{visibleMedicines.length} items</span></div>
          <label className="inventory-search"><span className="sr-only">Search medicines</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or category" /></label>
          {loading ? <p className="pos-empty">Loading catalog…</p> : <div className="pos-medicine-list">{visibleMedicines.map((medicine) => <article key={medicine.id} className="pos-medicine-card"><div className="pos-medicine-copy"><strong>{medicine.name} {medicine.strength}</strong><small>{medicine.category || medicine.dosage_form} · {Number(medicine.usable_stock ?? 0)} packs available</small><span>{formatCurrency(Number(medicine.unit_price ?? 0))} / pack</span></div><button type="button" className="pos-add-button" disabled={!medicine.usable_stock} onClick={() => updateQuantity(medicine, 1)}>{cart[medicine.id] ? `Add another (${cart[medicine.id]})` : 'Add to cart'}</button></article>)}{!visibleMedicines.length && <p className="pos-empty">No medicines match your search.</p>}</div>}
        </section>
        <form className="panel pos-cart" onSubmit={handleCheckout}><div className="panel-heading"><div><h2>Checkout</h2><p>{cartItems.length} medicine types</p></div><span className="pos-cart-icon">$</span></div>
          <label className="pos-field">Customer<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Walk-in customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <div className="pos-cart-lines">{cartItems.map((medicine) => <div key={medicine.id} className="pos-cart-line"><div><strong>{medicine.name} {medicine.strength}</strong><small>{formatCurrency(Number(medicine.unit_price ?? 0))} × {cart[medicine.id]}</small></div><div className="pos-quantity"><button type="button" aria-label={`Remove one ${medicine.name}`} onClick={() => updateQuantity(medicine, -1)}>−</button><span>{cart[medicine.id]}</span><button type="button" aria-label={`Add one ${medicine.name}`} onClick={() => updateQuantity(medicine, 1)}>+</button></div><strong>{formatCurrency(Number(medicine.unit_price ?? 0) * cart[medicine.id])}</strong></div>)}{!cartItems.length && <p className="pos-empty">Your cart is empty. Choose medicines from the catalog.</p>}</div>
          <label className="pos-field">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as SaleRecord['payment_method'])}><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Digital transfer</option></select></label>
          <label className="pos-field">Tax rate (%)<input type="number" min="0" max="25" step="0.01" value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} /></label>
          <div className="pos-totals"><div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div><span>Tax</span><strong>{formatCurrency(taxAmount)}</strong></div><div className="pos-grand-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div></div>
          <button type="submit" disabled={!cartItems.length || submitting} className="pos-checkout-button">{submitting ? 'Completing sale…' : `Complete Sale · ${formatCurrency(total)}`}</button>
        </form>
      </div>
      <section className="panel mt-5"><div className="panel-heading"><div><h2>Recent sales</h2><p>Latest completed receipts in this pharmacy</p></div></div>{recentSales.length ? <div className="table-scroll"><table className="w-full text-left text-sm"><thead><tr><th className="py-2 text-slate-500">Receipt</th><th className="py-2 text-slate-500">Date</th><th className="py-2 text-slate-500">Payment</th><th className="py-2 text-right text-slate-500">Total</th></tr></thead><tbody>{recentSales.map((sale) => <tr key={sale.id} className="border-t border-slate-100"><td className="py-3 font-medium">{sale.id.slice(-10).toUpperCase()}</td><td className="py-3 text-slate-600">{new Date(sale.created_at).toLocaleString()}</td><td className="py-3 capitalize text-slate-600">{sale.payment_method}</td><td className="py-3 text-right font-semibold">{formatCurrency(Number(sale.total_amount))}</td></tr>)}</tbody></table></div> : <p className="pos-empty">No sales have been recorded yet.</p>}</section>
    </div>
  );
}
