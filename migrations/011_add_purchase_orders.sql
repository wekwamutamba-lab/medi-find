-- 011_add_purchase_orders.sql
-- Purchase orders for restocking inventory from suppliers
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_packs INTEGER NOT NULL CHECK (quantity_packs > 0),
  unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
  line_cost NUMERIC(12,2) NOT NULL CHECK (line_cost >= 0),
  received_quantity_packs INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity_packs >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_po_number_unique_idx ON public.purchase_orders (pharmacy_id, po_number);
CREATE INDEX IF NOT EXISTS purchase_orders_pharmacy_status_idx ON public.purchase_orders (pharmacy_id, status);
CREATE INDEX IF NOT EXISTS purchase_order_items_po_idx ON public.purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS purchase_order_items_medicine_idx ON public.purchase_order_items (medicine_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_orders_tenant_isolation ON public.purchase_orders FOR ALL TO authenticated
  USING (pharmacy_id = public.current_user_pharmacy_id())
  WITH CHECK (pharmacy_id = public.current_user_pharmacy_id());

CREATE POLICY purchase_order_items_tenant_isolation ON public.purchase_order_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.pharmacy_id = public.current_user_pharmacy_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.pharmacy_id = public.current_user_pharmacy_id()
    )
  );