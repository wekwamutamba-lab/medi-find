-- 003_indexes.sql
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id ON batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch_id ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active);
