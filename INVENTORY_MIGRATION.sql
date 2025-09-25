-- ===============================================
-- INVENTORY MODULE MIGRATION
-- ===============================================
-- Run this script in your Supabase SQL Editor
-- This creates the inventory_items and inventory_transactions tables
-- along with all necessary functions and policies

-- Create inventory_items table for the Infinity Gaming Lounge POS system
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher')),
    stock_quantity integer DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
    unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
    cost_price numeric(10,2) CHECK (cost_price >= 0),
    supplier text,
    expiry_date date,
    is_redeemable boolean DEFAULT false NOT NULL,
    points_required numeric(10,2) DEFAULT 0 NOT NULL CHECK (points_required >= 0),
    is_vip_only boolean DEFAULT false NOT NULL,
    is_promo_active boolean DEFAULT false NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL CHECK (low_stock_threshold >= 0),
    CONSTRAINT inventory_items_name_category_unique UNIQUE(name, category)
);

-- Create inventory_transactions table to track all stock changes
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    transaction_type text NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'expiry', 'damage', 'redeem')),
    quantity_change integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    unit_price numeric(10,2),
    total_value numeric(10,2),
    related_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
    related_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    notes text,
    performed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    payment_method text CHECK (payment_method IN ('cash', 'mpesa', 'mpesa-stk', 'split', 'loyalty_points')) DEFAULT 'cash'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON public.inventory_items(stock_quantity) WHERE stock_quantity <= low_stock_threshold;
CREATE INDEX IF NOT EXISTS idx_inventory_items_promo ON public.inventory_items(is_promo_active) WHERE is_promo_active = true;
CREATE INDEX IF NOT EXISTS idx_inventory_items_vip ON public.inventory_items(is_vip_only) WHERE is_vip_only = true;
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON public.inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_session ON public.inventory_transactions(related_session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_customer ON public.inventory_transactions(related_customer_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log inventory transactions
CREATE OR REPLACE FUNCTION log_inventory_transaction(
    p_item_id uuid,
    p_transaction_type text,
    p_quantity_change integer,
    p_previous_quantity integer,
    p_new_quantity integer,
    p_unit_price numeric(10,2) DEFAULT NULL,
    p_related_session_id uuid DEFAULT NULL,
    p_related_customer_id uuid DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_performed_by uuid DEFAULT NULL,
    p_payment_method text DEFAULT 'cash'
) RETURNS uuid AS $$
DECLARE
    transaction_id uuid;
    calculated_total_value numeric(10,2);
BEGIN
    -- Calculate total value
    IF p_unit_price IS NOT NULL THEN
        calculated_total_value := ABS(p_quantity_change) * p_unit_price;
    END IF;

    -- Insert transaction record
    INSERT INTO public.inventory_transactions (
        item_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        unit_price,
        total_value,
        related_session_id,
        related_customer_id,
        notes,
        performed_by,
        payment_method
    ) VALUES (
        p_item_id,
        p_transaction_type,
        p_quantity_change,
        p_previous_quantity,
        p_new_quantity,
        p_unit_price,
        calculated_total_value,
        p_related_session_id,
        p_related_customer_id,
        p_notes,
        p_performed_by,
        p_payment_method
    ) RETURNING id INTO transaction_id;

    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update stock quantity and log transaction
CREATE OR REPLACE FUNCTION update_inventory_stock(
    p_item_id uuid,
    p_quantity_change integer,
    p_transaction_type text DEFAULT 'adjustment',
    p_unit_price numeric(10,2) DEFAULT NULL,
    p_related_session_id uuid DEFAULT NULL,
    p_related_customer_id uuid DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_performed_by uuid DEFAULT NULL,
    p_payment_method text DEFAULT 'cash'
) RETURNS uuid AS $$
DECLARE
    current_quantity integer;
    new_quantity integer;
    transaction_id uuid;
BEGIN
    -- Get current stock quantity
    SELECT stock_quantity INTO current_quantity
    FROM public.inventory_items
    WHERE id = p_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found: %', p_item_id;
    END IF;

    -- Calculate new quantity
    new_quantity := current_quantity + p_quantity_change;

    -- Prevent negative stock for sales
    IF p_transaction_type = 'sale' AND new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for sale. Current stock: %, Requested: %', current_quantity, ABS(p_quantity_change);
    END IF;

    -- Update stock quantity
    UPDATE public.inventory_items
    SET stock_quantity = new_quantity
    WHERE id = p_item_id;

    -- Log the transaction
    SELECT log_inventory_transaction(
        p_item_id,
        p_transaction_type,
        p_quantity_change,
        current_quantity,
        new_quantity,
        p_unit_price,
        p_related_session_id,
        p_related_customer_id,
        p_notes,
        p_performed_by,
        p_payment_method
    ) INTO transaction_id;

    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get inventory summary stats
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS TABLE (
    total_items integer,
    total_value numeric(10,2),
    low_stock_count integer,
    promo_items_count integer,
    vip_items_count integer,
    total_stock_quantity bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::integer,
        COALESCE(SUM(stock_quantity * unit_price), 0)::numeric(10,2),
        COUNT(*) FILTER (WHERE stock_quantity <= low_stock_threshold)::integer,
        COUNT(*) FILTER (WHERE is_promo_active)::integer,
        COUNT(*) FILTER (WHERE is_vip_only)::integer,
        COALESCE(SUM(stock_quantity), 0)::bigint
    FROM public.inventory_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get items with low stock
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    id uuid,
    name text,
    category text,
    stock_quantity integer,
    low_stock_threshold integer,
    unit_price numeric(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.name,
        i.category,
        i.stock_quantity,
        i.low_stock_threshold,
        i.unit_price
    FROM public.inventory_items i
    WHERE i.stock_quantity <= i.low_stock_threshold
    ORDER BY i.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_items
CREATE POLICY "Allow read access to authenticated users" ON public.inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to admin and supervisor" ON public.inventory_items
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'supervisor')
    );

-- Create policies for inventory_transactions
CREATE POLICY "Allow read access to authenticated users" ON public.inventory_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for cashiers, supervisors, and admins" ON public.inventory_transactions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'supervisor', 'cashier')
    );

COMMENT ON TABLE public.inventory_items IS 'Stores inventory items for the gaming lounge POS system';
COMMENT ON TABLE public.inventory_transactions IS 'Logs all inventory stock changes and transactions';
COMMENT ON FUNCTION log_inventory_transaction IS 'Logs an inventory transaction with all relevant details';
COMMENT ON FUNCTION update_inventory_stock IS 'Updates stock quantity and logs the transaction atomically';
COMMENT ON FUNCTION get_inventory_stats IS 'Returns summary statistics for inventory dashboard';
COMMENT ON FUNCTION get_low_stock_items IS 'Returns items that are below their low stock threshold';

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================
-- After running this script, you can:
-- 1. Access the inventory page at /inventory
-- 2. Add, edit, and delete inventory items
-- 3. Track stock levels and get low stock alerts
-- 4. Use the stock tracking functions in your POS system
--
-- The inventory module is now ready to use!
-- ===============================================