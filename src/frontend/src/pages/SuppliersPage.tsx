export function SuppliersPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> supplier hub</span></div>
          <h1>Supplier Management</h1>
          <p className="page-subtitle">Monitor supplier delivery performance, payment status, and contract health.</p>
        </div>
      </div>

      <div className="quick-grid">
        <div className="quick-card quick-sky">
          <div className="quick-copy">
            <strong>Active suppliers</strong>
            <small>28 accounts</small>
          </div>
        </div>
        <div className="quick-card quick-blue">
          <div className="quick-copy">
            <strong>On-time delivery</strong>
            <small>94.8% SLA</small>
          </div>
        </div>
        <div className="quick-card quick-teal">
          <div className="quick-copy">
            <strong>Open invoices</strong>
            <small>12 due this week</small>
          </div>
        </div>
      </div>
    </div>
  );
}
