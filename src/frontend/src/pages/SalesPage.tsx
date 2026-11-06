export function SalesPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> sales</span></div>
          <h1>Sales Overview</h1>
          <p className="page-subtitle">Review daily sales, ticket totals, and high-volume product categories.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top"><span>Daily sales</span><span className="metric-icon icon-blue">$</span></div>
          <div className="metric-value">৳42,800</div>
          <div className="metric-foot"><span className="trend-positive">+9.2%</span><span>vs yesterday</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-top"><span>Transactions</span><span className="metric-icon icon-teal">#</span></div>
          <div className="metric-value">328</div>
          <div className="metric-foot"><span className="trend-positive">+14%</span><span>this week</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-top"><span>Avg. basket</span><span className="metric-icon icon-amber">₺</span></div>
          <div className="metric-value">৳306</div>
          <div className="metric-foot"><span className="trend-warning">-1.4%</span><span>billing mix</span></div>
        </div>
      </div>
    </div>
  );
}
