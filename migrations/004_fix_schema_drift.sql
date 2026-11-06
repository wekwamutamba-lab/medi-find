-- 004_fix_schema_drift.sql
-- Handles partially applied local schemas that were created before the full medicines/batches definitions were present.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS strength TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS dosage_form TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS pack_size INTEGER;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS reorder_level INTEGER;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

UPDATE medicines
SET strength = COALESCE(strength, 'N/A'),
    dosage_form = COALESCE(dosage_form, 'tablet'),
    pack_size = COALESCE(pack_size, 1),
    reorder_level = COALESCE(reorder_level, 0),
    is_active = COALESCE(is_active, TRUE)
WHERE strength IS NULL OR dosage_form IS NULL OR pack_size IS NULL OR reorder_level IS NULL OR is_active IS NULL;

ALTER TABLE medicines ALTER COLUMN strength SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN dosage_form SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN pack_size SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN reorder_level SET DEFAULT 0;
ALTER TABLE medicines ALTER COLUMN reorder_level SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE medicines ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE batches ADD COLUMN IF NOT EXISTS quantity_packs INTEGER;
UPDATE batches SET quantity_packs = COALESCE(quantity_packs, 0) WHERE quantity_packs IS NULL;
ALTER TABLE batches ALTER COLUMN quantity_packs SET DEFAULT 0;
ALTER TABLE batches ALTER COLUMN quantity_packs SET NOT NULL;
ALTER TABLE batches ADD CONSTRAINT batches_quantity_packs_nonnegative CHECK (quantity_packs >= 0) NOT VALID;

ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS quantity_packs INTEGER;
UPDATE stock_movements SET quantity_packs = COALESCE(quantity_packs, 0) WHERE quantity_packs IS NULL;
ALTER TABLE stock_movements ALTER COLUMN quantity_packs SET NOT NULL;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_quantity_packs_nonzero CHECK (quantity_packs <> 0) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_batches_medicine_id ON batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch_id ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active);
