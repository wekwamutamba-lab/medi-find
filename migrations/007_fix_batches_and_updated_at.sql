-- 007_fix_batches_and_updated_at.sql
ALTER TABLE batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE batches SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE batches ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE batches ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE medicines SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
ALTER TABLE medicines ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE medicines ALTER COLUMN updated_at SET NOT NULL;
