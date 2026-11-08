-- Additive multi-tenant migration. Review/back up production data and verify migration history before applying.
-- The existing stock_movements table is the application's inventory-movement ledger.

CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pharmacy_id UUID;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin','pharmacist','staff'));

ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS pharmacy_id UUID;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS pharmacy_id UUID;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS manufacturing_date DATE;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0);
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS pharmacy_id UUID;
ALTER TABLE public.alert_settings ADD COLUMN IF NOT EXISTS pharmacy_id UUID;

-- Reconcile common partial/legacy inventory schemas before tenant backfill.
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS strength TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS dosage_form TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS pack_size INTEGER;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS quantity_packs INTEGER DEFAULT 0;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS quantity_packs INTEGER;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS movement_type TEXT;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS performed_by UUID;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='batches' AND column_name='quantity_in_stock') THEN
    EXECUTE 'UPDATE public.batches SET quantity_packs = COALESCE(quantity_in_stock, 0)';
  ELSE
    UPDATE public.batches SET quantity_packs = COALESCE(quantity_packs, 0);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_movements' AND column_name='quantity_change') THEN
    EXECUTE 'UPDATE public.stock_movements SET quantity_packs = COALESCE(quantity_change, 0)';
  ELSE
    UPDATE public.stock_movements SET quantity_packs = COALESCE(quantity_packs, 0);
  END IF;
END $$;

UPDATE public.medicines SET strength=COALESCE(strength,'N/A'), dosage_form=COALESCE(dosage_form,'tablet'), pack_size=COALESCE(pack_size,1), category=COALESCE(category,'Other'), reorder_level=COALESCE(reorder_level,0), unit_price=COALESCE(unit_price,0), is_active=COALESCE(is_active,TRUE);
ALTER TABLE public.medicines ALTER COLUMN strength SET NOT NULL;
ALTER TABLE public.medicines ALTER COLUMN dosage_form SET NOT NULL;
ALTER TABLE public.medicines ALTER COLUMN pack_size SET NOT NULL;
ALTER TABLE public.medicines ALTER COLUMN category SET NOT NULL;
ALTER TABLE public.medicines ALTER COLUMN reorder_level SET NOT NULL;
ALTER TABLE public.medicines ALTER COLUMN unit_price SET NOT NULL;
ALTER TABLE public.medicines ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.batches ALTER COLUMN quantity_packs SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN quantity_packs SET NOT NULL;

DO $$
DECLARE
  legacy_pharmacy_id UUID;
  legacy_owner_id UUID;
BEGIN
  SELECT id INTO legacy_pharmacy_id FROM public.pharmacies WHERE name = 'Legacy Pharmacy' ORDER BY created_at LIMIT 1;
  IF legacy_pharmacy_id IS NULL THEN
    SELECT id INTO legacy_owner_id FROM public.profiles ORDER BY created_at LIMIT 1;
    INSERT INTO public.pharmacies (name, license_number, owner_id)
    VALUES ('Legacy Pharmacy', 'LEGACY-MIGRATION', legacy_owner_id)
    ON CONFLICT (license_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO legacy_pharmacy_id;
  END IF;

  UPDATE public.profiles SET pharmacy_id = legacy_pharmacy_id WHERE pharmacy_id IS NULL;
  UPDATE public.medicines SET pharmacy_id = legacy_pharmacy_id WHERE pharmacy_id IS NULL;
  UPDATE public.batches b SET pharmacy_id = m.pharmacy_id FROM public.medicines m WHERE b.medicine_id = m.id AND b.pharmacy_id IS NULL;
  UPDATE public.batches SET pharmacy_id = legacy_pharmacy_id WHERE pharmacy_id IS NULL;
  UPDATE public.stock_movements sm SET pharmacy_id = b.pharmacy_id FROM public.batches b WHERE sm.batch_id = b.id AND sm.pharmacy_id IS NULL;
  UPDATE public.stock_movements SET pharmacy_id = legacy_pharmacy_id WHERE pharmacy_id IS NULL;
  UPDATE public.alert_settings SET pharmacy_id = legacy_pharmacy_id WHERE pharmacy_id IS NULL;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;
ALTER TABLE public.medicines ADD CONSTRAINT medicines_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;
ALTER TABLE public.batches ADD CONSTRAINT batches_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;
ALTER TABLE public.alert_settings ADD CONSTRAINT alert_settings_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;
ALTER TABLE public.alert_settings DROP CONSTRAINT IF EXISTS alert_settings_pkey;
ALTER TABLE public.alert_settings ADD CONSTRAINT alert_settings_pkey PRIMARY KEY (pharmacy_id, id);

ALTER TABLE public.medicines ALTER COLUMN pharmacy_id SET NOT NULL;
ALTER TABLE public.batches ALTER COLUMN pharmacy_id SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN pharmacy_id SET NOT NULL;
ALTER TABLE public.alert_settings ALTER COLUMN pharmacy_id SET NOT NULL;

-- Remove legacy global identities so medicine/batch names can be independently reused per tenant.
ALTER TABLE public.medicines DROP CONSTRAINT IF EXISTS medicines_name_strength_dosage_form_pack_size_key;
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_medicine_id_batch_number_key;
DROP INDEX IF EXISTS public.medicines_unique_identity_idx;
DROP INDEX IF EXISTS public.batches_unique_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS medicines_tenant_identity_idx ON public.medicines (pharmacy_id, name, strength, dosage_form, pack_size);
CREATE UNIQUE INDEX IF NOT EXISTS batches_tenant_identity_idx ON public.batches (pharmacy_id, medicine_id, batch_number);
CREATE UNIQUE INDEX IF NOT EXISTS alert_settings_pharmacy_unique_idx ON public.alert_settings (pharmacy_id);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_pharmacy_id_unique_idx ON public.customers (pharmacy_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS medicines_pharmacy_id_unique_idx ON public.medicines (pharmacy_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS batches_pharmacy_id_unique_idx ON public.batches (pharmacy_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pharmacy_id_unique_idx ON public.profiles (pharmacy_id, id);
ALTER TABLE public.batches ADD CONSTRAINT batches_medicine_tenant_fk FOREIGN KEY (pharmacy_id, medicine_id) REFERENCES public.medicines(pharmacy_id, id);
ALTER TABLE public.stock_movements ADD CONSTRAINT movements_batch_tenant_fk FOREIGN KEY (pharmacy_id, batch_id) REFERENCES public.batches(pharmacy_id, id);
ALTER TABLE public.stock_movements ADD CONSTRAINT movements_performer_tenant_fk FOREIGN KEY (pharmacy_id, performed_by) REFERENCES public.profiles(pharmacy_id, id);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  customer_id UUID,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','transfer')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','voided')),
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sales_customer_tenant_fk FOREIGN KEY (pharmacy_id, customer_id) REFERENCES public.customers(pharmacy_id, id)
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  quantity_packs INTEGER NOT NULL CHECK (quantity_packs > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_pharmacy_id_unique_idx ON public.sales (pharmacy_id, id);
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_sale_tenant_fk FOREIGN KEY (pharmacy_id, sale_id) REFERENCES public.sales(pharmacy_id, id);
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_medicine_tenant_fk FOREIGN KEY (pharmacy_id, medicine_id) REFERENCES public.medicines(pharmacy_id, id);
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_batch_tenant_fk FOREIGN KEY (pharmacy_id, batch_id) REFERENCES public.batches(pharmacy_id, id);

CREATE INDEX IF NOT EXISTS profiles_pharmacy_idx ON public.profiles(pharmacy_id);
CREATE INDEX IF NOT EXISTS medicines_pharmacy_idx ON public.medicines(pharmacy_id, is_active);
CREATE INDEX IF NOT EXISTS batches_pharmacy_expiry_idx ON public.batches(pharmacy_id, expiry_date);
CREATE INDEX IF NOT EXISTS stock_movements_pharmacy_created_idx ON public.stock_movements(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customers_pharmacy_idx ON public.customers(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS suppliers_pharmacy_idx ON public.suppliers(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_pharmacy_created_idx ON public.sales(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sale_items_pharmacy_sale_idx ON public.sale_items(pharmacy_id, sale_id);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read profiles" ON public.profiles;
DROP POLICY IF EXISTS "auth read medicines" ON public.medicines;
DROP POLICY IF EXISTS "auth read batches" ON public.batches;
DROP POLICY IF EXISTS "auth read movements" ON public.stock_movements;
DROP POLICY IF EXISTS "auth read alert_settings" ON public.alert_settings;

CREATE OR REPLACE FUNCTION public.current_user_pharmacy_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT pharmacy_id FROM public.profiles WHERE id = auth.uid() $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['medicines','batches','alert_settings','customers','suppliers','sales','sale_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', table_name);
    EXECUTE format('CREATE POLICY tenant_isolation ON public.%I FOR ALL TO authenticated USING (pharmacy_id = public.current_user_pharmacy_id()) WITH CHECK (pharmacy_id = public.current_user_pharmacy_id())', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS tenant_isolation ON public.stock_movements;
CREATE POLICY tenant_movement_read ON public.stock_movements FOR SELECT TO authenticated
  USING (pharmacy_id = public.current_user_pharmacy_id());
CREATE POLICY tenant_movement_insert ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (pharmacy_id = public.current_user_pharmacy_id());

DROP POLICY IF EXISTS tenant_isolation ON public.profiles;
CREATE POLICY tenant_isolation ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR pharmacy_id = public.current_user_pharmacy_id());
CREATE POLICY profile_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND pharmacy_id = public.current_user_pharmacy_id());

DROP POLICY IF EXISTS tenant_isolation ON public.pharmacies;
CREATE POLICY tenant_isolation ON public.pharmacies FOR SELECT TO authenticated
  USING (id = public.current_user_pharmacy_id());
CREATE POLICY pharmacy_owner_update ON public.pharmacies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- The backend service key bypasses RLS; every API query must also scope by the verified profile pharmacy_id.
