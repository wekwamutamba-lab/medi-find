import { getLowStockItems, getExpiringBatches } from '../services/alerts.service';
import { getMedicine, listMedicines } from '../services/medicines.service';
import { listMovementsForMedicine } from '../services/movements.service';
import { getAttentionSummary } from '../services/summary.service';

export const toolHandlers: Record<string, (args: any, pharmacyId: string) => Promise<any>> = {
  async get_low_stock_items(_args, pharmacyId) {
    return getLowStockItems(pharmacyId);
  },
  async get_expiring_batches(args: { days: number }, pharmacyId) {
    return getExpiringBatches(args.days, pharmacyId);
  },
  async get_medicine_stock(args: { medicine_id?: string; name_search?: string }, pharmacyId) {
    if (args.medicine_id) {
      return getMedicine(args.medicine_id, pharmacyId);
    }
    const list = await listMedicines({
      pharmacy_id: pharmacyId,
      search: args.name_search,
      include_inactive: false,
      page: 1,
      limit: 50,
    });
    return list.items;
  },
  async get_stock_movements(args: { medicine_id: string; limit?: number }, pharmacyId) {
    return listMovementsForMedicine(args.medicine_id, 1, args.limit ?? 20, pharmacyId);
  },
  async get_attention_summary(_args, pharmacyId) {
    return getAttentionSummary(pharmacyId);
  },
};
