-- Inventory Management System Database Schema
-- Run this in your Supabase SQL Editor

-- ================================
-- 1. CREATE INVENTORY_ITEMS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher')),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC(10,2) CHECK (cost_price >= 0),
    supplier TEXT,
    expiry_date DATE,
    is_redeemable BOOLEAN DEFAULT FALSE,
    points_required NUMERIC(10,2) DEFAULT 0 CHECK (points_required >= 0),
    is_vip_only BOOLEAN DEFAULT FALSE,
    is_promo_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. CREATE INVENTORY_TRANSACTIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'expired', 'damaged')),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2),
    total_amount NUMERIC(10,2),
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'mpesa', 'split', 'loyalty_points')),
    notes TEXT,
    performed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock ON public.inventory_items(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_items_promo ON public.inventory_items(is_promo_active);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON public.inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_session ON public.inventory_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON public.inventory_transactions(created_at);

-- ================================
-- 4. ENABLE RLS ON INVENTORY TABLES
-- ================================
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ================================
-- 5. CREATE RLS POLICIES FOR INVENTORY
-- ================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to read inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory_transactions" ON public.inventory_transactions;

-- Allow authenticated users to read and manage inventory
CREATE POLICY "Allow authenticated users to read inventory_items" 
ON public.inventory_items 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage inventory_items" 
ON public.inventory_items 
FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to read inventory_transactions" 
ON public.inventory_transactions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage inventory_transactions" 
ON public.inventory_transactions 
FOR ALL 
TO authenticated 
USING (true);

-- ================================
-- 6. CREATE FUNCTIONS FOR INVENTORY MANAGEMENT
-- ================================

-- Function to update stock quantity after transactions
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stock based on transaction type
    CASE NEW.transaction_type
        WHEN 'sale', 'expired', 'damaged' THEN
            UPDATE public.inventory_items 
            SET stock_quantity = stock_quantity - NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.item_id;
        WHEN 'restock', 'adjustment' THEN
            UPDATE public.inventory_items 
            SET stock_quantity = stock_quantity + NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.item_id;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic stock updates
DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON public.inventory_transactions;
CREATE TRIGGER trigger_update_inventory_stock
    AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_stock();

-- Function to check if item has sufficient stock
CREATE OR REPLACE FUNCTION check_inventory_stock(item_uuid UUID, required_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO current_stock
    FROM public.inventory_items
    WHERE id = item_uuid;
    
    RETURN current_stock >= required_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items(threshold INTEGER DEFAULT 5)
RETURNS TABLE(
    id UUID,
    name TEXT,
    category TEXT,
    stock_quantity INTEGER,
    unit_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.name, i.category, i.stock_quantity, i.unit_price
    FROM public.inventory_items i
    WHERE i.stock_quantity <= threshold
    ORDER BY i.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 7. INSERT SAMPLE INVENTORY DATA
-- ================================
INSERT INTO public.inventory_items (name, category, stock_quantity, unit_price, cost_price, is_redeemable, points_required, is_promo_active) VALUES
('Coca Cola 500ml', 'Drink', 50, 80.00, 60.00, true, 100, false),
('Pepsi 500ml', 'Drink', 45, 80.00, 60.00, true, 100, false),
('Energy Drink', 'Drink', 30, 150.00, 120.00, true, 200, true),
('Chips - Original', 'Snack', 40, 50.00, 35.00, true, 75, false),
('Chips - BBQ', 'Snack', 35, 50.00, 35.00, true, 75, false),
('Gaming Mouse', 'Merchandise', 10, 2500.00, 2000.00, true, 5000, false),
('Gaming Headset', 'Merchandise', 8, 3500.00, 2800.00, true, 7000, true),
('Keyboard', 'Equipment', 5, 1500.00, 1200.00, false, 0, false),
('1 Hour Gaming Voucher', 'Voucher', 100, 100.00, 0.00, true, 150, false),
('VIP Membership Card', 'Voucher', 20, 1000.00, 0.00, true, 2000, true);

-- ================================
-- INVENTORY SCHEMA SETUP COMPLETE!
-- ================================
-- Tables created: inventory_items, inventory_transactions
-- Indexes, RLS policies, and functions are set up
-- Sample data inserted for testing
-- Ready for frontend integration