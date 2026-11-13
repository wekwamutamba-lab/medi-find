-- 010_add_inventory_financial_fields.sql
-- Add brand name, generic name, purchase price, min stock level to medicines
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS generic_name TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS min_stock_level INTEGER NOT NULL DEFAULT 0;

-- Backfill existing records
UPDATE public.medicines SET brand_name = COALESCE(brand_name, name) WHERE brand_name IS NULL;
UPDATE public.medicines SET generic_name = COALESCE(generic_name, name) WHERE generic_name IS NULL;
UPDATE public.medicines SET purchase_price = COALESCE(purchase_price, 0) WHERE purchase_price IS NULL;
UPDATE public.medicines SET min_stock_level = COALESCE(min_stock_level, reorder_level) WHERE min_stock_level IS NULL;

-- Add cost tracking to sale_items for gross profit calculation
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS line_cost NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE public.sale_items SET cost_price = COALESCE(cost_price, 0) WHERE cost_price IS NULL;
UPDATE public.sale_items SET line_cost = COALESCE(line_cost, 0) WHERE line_cost IS NULL;

-- Add indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_medicines_purchase_price ON public.medicines(purchase_price);
CREATE INDEX IF NOT EXISTS idx_medicines_min_stock_level ON public.medicines(min_stock_level);
CREATE INDEX IF NOT EXISTS idx_sale_items_cost_price ON public.sale_items(cost_price);