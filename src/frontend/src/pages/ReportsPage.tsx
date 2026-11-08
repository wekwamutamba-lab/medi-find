export function ReportsPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> reports</span></div>
          <h1>Performance Reports</h1>
          <p className="page-subtitle">Track operating trends, stock movement quality, and pharmacy performance indicators.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top"><span>Revenue</span><span className="metric-icon icon-blue">R</span></div>
          <div className="metric-value">$184,000.00</div>
          <div className="metric-foot"><span className="trend-positive">+12.8%</span><span>vs last month</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-top"><span>Stock accuracy</span><span className="metric-icon icon-teal">A</span></div>
          <div className="metric-value">96.4%</div>
          <div className="metric-foot"><span className="trend-positive">+2.1%</span><span>improvement</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-top"><span>Turnover</span><span className="metric-icon icon-amber">T</span></div>
          <div className="metric-value">3.8x</div>
          <div className="metric-foot"><span className="trend-warning">-0.3%</span><span>this cycle</span></div>
        </div>
      </div>
    </div>
  );
}
