export type DashboardRange = 'today' | 'week' | 'month' | 'custom';

export const dashboardRangeLabels: Record<DashboardRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  custom: 'Custom Date',
};

export interface DashboardStats {
  sales: number;
  purchases: number;
  profit: number;
  transactions: number;
  topUnits: number[];
}

const sampleStats: Record<Exclude<DashboardRange, 'custom'>, DashboardStats> = {
  today: { sales: 42800, purchases: 9480, profit: 6310, transactions: 328, topUnits: [841, 611, 304] },
  week: { sales: 298600, purchases: 66450, profit: 44210, transactions: 2186, topUnits: [4021, 2874, 1460] },
  month: { sales: 1284500, purchases: 284500, profit: 189300, transactions: 9412, topUnits: [16840, 12110, 6170] },
};

export function getDashboardStats(range: DashboardRange, customDate: string): DashboardStats {
  if (range !== 'custom') return sampleStats[range];

  const day = customDate ? new Date(`${customDate}T00:00:00`).getDate() : new Date().getDate();
  const factor = 0.72 + (day % 10) * 0.055;
  const today = sampleStats.today;

  return {
    sales: Math.round(today.sales * factor),
    purchases: Math.round(today.purchases * factor),
    profit: Math.round(today.profit * factor),
    transactions: Math.round(today.transactions * factor),
    topUnits: today.topUnits.map((units) => Math.round(units * factor)),
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function getRangeDescription(range: DashboardRange, customDate: string) {
  if (range !== 'custom') return dashboardRangeLabels[range];
  if (!customDate) return dashboardRangeLabels.custom;
  return new Date(`${customDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
