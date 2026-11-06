-- 006_add_medicine_fields.sql
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);

UPDATE medicines
SET category = COALESCE(category, 'Other'),
    unit_price = COALESCE(unit_price, 0)
WHERE category IS NULL OR unit_price IS NULL;

ALTER TABLE medicines ALTER COLUMN category SET DEFAULT 'Other';
ALTER TABLE medicines ALTER COLUMN unit_price SET DEFAULT 0;
ALTER TABLE medicines ALTER COLUMN category SET NOT NULL;
ALTER TABLE medicines ALTER COLUMN unit_price SET NOT NULL;
