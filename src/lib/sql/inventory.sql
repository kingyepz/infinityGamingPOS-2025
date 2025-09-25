-- Inventory schema for Infinity Gaming Lounge POS
-- Tables: inventory_items, inventory_transactions
-- Triggers: maintain stock levels and validate transactions

-- Enable pgcrypto if not enabled (for gen_random_uuid)
-- NOTE: On Supabase this is enabled by default in the template.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) inventory_items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Snack','Drink','Merchandise','Equipment','Voucher')),
  stock_quantity integer NOT NULL DEFAULT 0,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  cost_price numeric(12,2) NULL CHECK (cost_price IS NULL OR cost_price >= 0),
  supplier text NULL,
  expiry_date date NULL,
  is_redeemable boolean NOT NULL DEFAULT false,
  points_required numeric(12,0) NOT NULL DEFAULT 0,
  is_vip_only boolean NOT NULL DEFAULT false,
  is_promo_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry ON public.inventory_items(expiry_date);

-- 2) inventory_transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('restock','sale','adjustment','redeem')),
  change_quantity integer NOT NULL,
  unit_price numeric(12,2) NULL,
  total_amount numeric(12,2) NULL,
  payment_method text NULL CHECK (payment_method IS NULL OR payment_method IN ('cash','mpesa','split')),
  session_id uuid NULL REFERENCES public.sessions(id) ON DELETE SET NULL,
  customer_id uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_item ON public.inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_created ON public.inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON public.inventory_transactions(transaction_type);

-- Trigger: updated_at on inventory_items
CREATE OR REPLACE FUNCTION public.touch_inventory_items_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_items_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_inventory_items_touch_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_inventory_items_updated_at();
  END IF;
END $$;

-- Validation: enforce sign of change_quantity by transaction_type and prevent negatives
CREATE OR REPLACE FUNCTION public.validate_and_apply_inventory_transaction()
RETURNS trigger AS $$
DECLARE
  current_stock integer;
  new_stock integer;
BEGIN
  -- Enforce quantity signs by type
  IF (NEW.transaction_type = 'restock' AND NEW.change_quantity <= 0) THEN
    RAISE EXCEPTION 'Restock must have positive change_quantity';
  ELSIF ((NEW.transaction_type = 'sale' OR NEW.transaction_type = 'redeem') AND NEW.change_quantity >= 0) THEN
    RAISE EXCEPTION 'Sale/Redeem must have negative change_quantity';
  ELSIF (NEW.transaction_type = 'adjustment' AND NEW.change_quantity = 0) THEN
    RAISE EXCEPTION 'Adjustment cannot be zero';
  END IF;

  -- Set totals if not provided
  IF NEW.unit_price IS NULL THEN
    SELECT unit_price INTO NEW.unit_price FROM public.inventory_items WHERE id = NEW.item_id;
  END IF;
  IF NEW.total_amount IS NULL THEN
    NEW.total_amount := COALESCE(NEW.unit_price,0) * ABS(NEW.change_quantity);
  END IF;

  -- Stock update with prevention of negative stock
  SELECT stock_quantity INTO current_stock FROM public.inventory_items WHERE id = NEW.item_id FOR UPDATE;
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Item % not found', NEW.item_id;
  END IF;

  new_stock := current_stock + NEW.change_quantity;
  IF new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, requested change: %', current_stock, NEW.change_quantity;
  END IF;

  UPDATE public.inventory_items SET stock_quantity = new_stock WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_tx_validate_apply'
  ) THEN
    CREATE TRIGGER trg_inventory_tx_validate_apply
    BEFORE INSERT ON public.inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_and_apply_inventory_transaction();
  END IF;
END $$;

-- Optional helper view: sales summary per item
CREATE OR REPLACE VIEW public.inventory_sales_summary AS
SELECT
  it.item_id,
  i.name,
  SUM(CASE WHEN it.transaction_type IN ('sale','redeem') THEN -it.change_quantity ELSE 0 END) AS units_sold,
  SUM(CASE WHEN it.transaction_type IN ('sale','redeem') THEN it.total_amount ELSE 0 END) AS revenue
FROM public.inventory_transactions it
JOIN public.inventory_items i ON i.id = it.item_id
GROUP BY it.item_id, i.name;

-- RLS (Policy) notes:
-- 1) Enable RLS and allow authenticated users to read items.
-- 2) Allow insert into transactions for authenticated users; restrict updates/deletes as needed.
-- 3) Allow admins/supervisors to insert/update/delete items, others read-only.
-- Example (adjust to your roles table/claims):
-- ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "inventory_items_read" ON public.inventory_items FOR SELECT USING (auth.role() IN ('authenticated'));
-- CREATE POLICY "inventory_items_write" ON public.inventory_items FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','supervisor')) WITH CHECK (auth.jwt() ->> 'role' IN ('admin','supervisor'));
-- CREATE POLICY "inventory_tx_insert" ON public.inventory_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

