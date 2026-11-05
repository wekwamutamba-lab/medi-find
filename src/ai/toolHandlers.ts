import { getLowStockItems, getExpiringBatches } from '../services/alerts.service';
import { getMedicine, listMedicines } from '../services/medicines.service';
import { listMovementsForMedicine } from '../services/movements.service';
import { getAttentionSummary } from '../services/summary.service';

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  async get_low_stock_items() {
    return getLowStockItems();
  },
  async get_expiring_batches(args: { days: number }) {
    return getExpiringBatches(args.days);
  },
  async get_medicine_stock(args: { medicine_id?: string; name_search?: string }) {
    if (args.medicine_id) {
      return getMedicine(args.medicine_id);
    }
    const list = await listMedicines({
      search: args.name_search,
      include_inactive: false,
      page: 1,
      limit: 50,
    });
    return list.items;
  },
  async get_stock_movements(args: { medicine_id: string; limit?: number }) {
    return listMovementsForMedicine(args.medicine_id, 1, args.limit ?? 20);
  },
  async get_attention_summary() {
    return getAttentionSummary();
  },
};
