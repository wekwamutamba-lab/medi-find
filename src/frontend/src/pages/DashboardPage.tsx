import { ArrowRight, BadgeDollarSign, Building2, ChevronDown, CircleDollarSign, PackageCheck, Pill, ReceiptText, Store } from 'lucide-react';

const metrics = [
  { label: 'Total Sales', value: '৳128,450', change: '+12.4%', trend: 'positive', icon: CircleDollarSign, tone: 'blue' },
  { label: 'Purchase', value: '৳28,450', change: '+8.1%', trend: 'positive', icon: ReceiptText, tone: 'teal' },
  { label: 'Total Items', value: '1,284', change: '+6.8%', trend: 'positive', icon: PackageCheck, tone: 'amber' },
  { label: 'Profit', value: '৳18,930', change: '-2.1%', trend: 'warning', icon: BadgeDollarSign, tone: 'purple' },
];

const quickCards = [
  { title: 'New Sale', subtitle: 'Create a new sale in just a few clicks', tone: 'blue', icon: BadgeDollarSign },
  { title: 'New Purchase', subtitle: 'Create a new purchase in just a few clicks', tone: 'teal', icon: ShoppingCartPlaceholder },
  { title: 'Add Medicine', subtitle: 'Create a new sale in just a few clicks', tone: 'purple', icon: Pill },
  { title: 'Store Status', subtitle: 'Check stock room availability and restocks', tone: 'sky', icon: Store },
];

function ShoppingCartPlaceholder() {
  return <ReceiptText size={16} />;
}

const topItems = [
  { name: 'Napa Extra 500mg', quantity: '841', percent: '72%', fill: 'fill-blue' },
  { name: 'Analgesic', quantity: '611', percent: '58%', fill: 'fill-teal' },
  { name: 'Seclo 20mg', quantity: '304', percent: '41%', fill: 'fill-amber' },
];

export function DashboardPage() {
  return (
    <div>
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> Live overview</span></div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Track orders, stock levels, and pharmacy activity across the day.</p>
        </div>
        <div className="heading-tools">
          <div className="period-wrap">
            <button type="button" className="period-button">
              <span>Today</span>
              <ChevronDown size={12} />
            </button>
          </div>
          <button type="button" className="export-button">
            <ArrowRight size={12} />
            Export
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map(({ label, value, change, trend, icon: Icon, tone }) => (
          <div key={label} className="metric-card">
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon icon-${tone}`}><Icon size={14} /></span>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">
              <span className={trend === 'warning' ? 'trend-warning' : 'trend-positive'}>{change}</span>
              <span>this month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-section">
        <div className="section-heading">
          <h2>Quick Action</h2>
          <button type="button" className="text-action">View all <ArrowRight size={10} /></button>
        </div>

        <div className="quick-grid">
          {quickCards.map(({ title, subtitle, tone, icon: Icon }) => (
            <button key={title} type="button" className={`quick-card quick-${tone}`}>
              <div className="quick-icon"><Icon size={16} /></div>
              <div className="quick-copy">
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </div>
              <span className="quick-arrow"><ArrowRight size={12} /></span>
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Top Selling Medicine</h2>
              <p>Best performing products this cycle</p>
            </div>
            <button type="button" className="more-button">⋯</button>
          </div>

          <div className="inventory-search">
            <Building2 size={12} />
            <input value="MediPulse" readOnly aria-label="search placeholder" />
          </div>

          <div className="table-header">
            <span>Medicine</span>
            <span>Trend</span>
            <span>Units</span>
          </div>

          {topItems.map((item) => (
            <div key={item.name} className="medicine-row">
              <div className="medicine-name">
                <div className="medicine-avatar"><Pill size={12} /></div>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.percent} share</small>
                </span>
              </div>
              <div className="stock-cell">
                <div className="stock-track"><span className={`stock-fill ${item.fill}`} style={{ width: item.percent }} /></div>
              </div>
              <div className="units-count">{item.quantity}</div>
            </div>
          ))}

          <button type="button" className="panel-footer-link">See insights <ArrowRight size={10} /></button>
        </div>

        <div className="panel categories-panel">
          <div className="panel-heading">
            <div>
              <h2>Medicine categories</h2>
              <p>Usage mix</p>
            </div>
            <button type="button" className="more-button">⋯</button>
          </div>

          <div className="chart-content">
            <div className="donut-chart">
              <div className="donut-hole">
                <strong>2,847</strong>
                <span>units</span>
              </div>
            </div>
            <div className="legend-list">
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#4d79f6' }} /> Respiratory</div>
                <strong>23%</strong>
              </div>
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#27344a' }} /> Analgesics</div>
                <strong>18%</strong>
              </div>
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#8b95a4' }} /> Other</div>
                <strong>14%</strong>
              </div>
              <div className="legend-item">
                <div className="legend-label"><i style={{ background: '#16aa83' }} /> Antibiotics</div>
                <strong>50%</strong>
              </div>
            </div>
          </div>

          <div className="category-note">
            <span className="note-check">✓</span>
            <span>Overall category mix is outperforming last month.</span>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <span><span className="footer-status" /> System healthy</span>
        <span>Last sync: 2 minutes ago</span>
        <button type="button">Open activity log</button>
      </div>
    </div>
  );
}
