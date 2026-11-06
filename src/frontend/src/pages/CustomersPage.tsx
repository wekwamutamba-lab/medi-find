export function CustomersPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> customer records</span></div>
          <h1>Customer Activity</h1>
          <p className="page-subtitle">Track customer orders, prescription history, and repeat-purchase behaviour.</p>
        </div>
      </div>

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
    </div>
  );
}
