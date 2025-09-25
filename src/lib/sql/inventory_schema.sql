-- Inventory Management Schema for Infinity Gaming Lounge POS
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher')),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC(10,2) CHECK (cost_price >= 0),
    supplier TEXT,
    expiry_date DATE,
    is_redeemable BOOLEAN NOT NULL DEFAULT false,
    points_required NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (points_required >= 0),
    is_vip_only BOOLEAN NOT NULL DEFAULT false,
    is_promo_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    unit_price NUMERIC(10,2),
    total_amount NUMERIC(10,2),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'mpesa', 'points')),
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock_quantity ON inventory_items(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry_date ON inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_redeemable ON inventory_items(is_redeemable);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_vip_only ON inventory_items(is_vip_only);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_promo_active ON inventory_items(is_promo_active);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_session_id ON inventory_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_customer_id ON inventory_transactions(customer_id);

-- Create updated_at trigger for inventory_items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update stock quantity when transactions are added
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the stock quantity in inventory_items
    UPDATE inventory_items 
    SET stock_quantity = NEW.new_quantity,
        updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_stock_trigger
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_stock();

-- Create function to get inventory statistics
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*),
        'total_stock_value', COALESCE(SUM(unit_price * stock_quantity), 0),
        'low_stock_items', COUNT(*) FILTER (WHERE stock_quantity < 5),
        'expiring_items', COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'),
        'total_transactions_today', (
            SELECT COUNT(*) FROM inventory_transactions 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'revenue_today', (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM inventory_transactions 
            WHERE DATE(created_at) = CURRENT_DATE 
            AND transaction_type = 'sale'
        ),
        'top_selling_items', (
            SELECT json_agg(
                json_build_object(
                    'item_id', inventory_item_id,
                    'item_name', (SELECT name FROM inventory_items WHERE id = inventory_item_id),
                    'quantity_sold', ABS(SUM(quantity_change)),
                    'revenue', SUM(total_amount)
                )
            )
            FROM inventory_transactions
            WHERE DATE(created_at) = CURRENT_DATE 
            AND transaction_type = 'sale'
            GROUP BY inventory_item_id
            ORDER BY ABS(SUM(quantity_change)) DESC
            LIMIT 5
        ),
        'category_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'category', category,
                    'item_count', COUNT(*),
                    'stock_value', SUM(unit_price * stock_quantity)
                )
            )
            FROM inventory_items
            GROUP BY category
            ORDER BY SUM(unit_price * stock_quantity) DESC
        )
    )
    INTO result
    FROM inventory_items;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to process inventory sale
CREATE OR REPLACE FUNCTION process_inventory_sale(
    p_item_id UUID,
    p_quantity INTEGER,
    p_session_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cash',
    p_notes TEXT DEFAULT NULL,
    p_recorded_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_item inventory_items%ROWTYPE;
    v_previous_quantity INTEGER;
    v_new_quantity INTEGER;
    v_transaction_id UUID;
    v_total_amount NUMERIC;
BEGIN
    -- Get item details
    SELECT * INTO v_item FROM inventory_items WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found');
    END IF;
    
    -- Check if sufficient stock
    IF v_item.stock_quantity < p_quantity THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    
    -- Calculate new quantity
    v_previous_quantity := v_item.stock_quantity;
    v_new_quantity := v_previous_quantity - p_quantity;
    v_total_amount := v_item.unit_price * p_quantity;
    
    -- Insert transaction record
    INSERT INTO inventory_transactions (
        inventory_item_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        unit_price,
        total_amount,
        session_id,
        customer_id,
        payment_method,
        notes,
        recorded_by
    ) VALUES (
        p_item_id,
        'sale',
        -p_quantity,
        v_previous_quantity,
        v_new_quantity,
        v_item.unit_price,
        v_total_amount,
        p_session_id,
        p_customer_id,
        p_payment_method,
        p_notes,
        p_recorded_by
    ) RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'total_amount', v_total_amount,
        'new_stock', v_new_quantity
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to process inventory restock
CREATE OR REPLACE FUNCTION process_inventory_restock(
    p_item_id UUID,
    p_quantity INTEGER,
    p_cost_price NUMERIC DEFAULT NULL,
    p_supplier TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_recorded_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_item inventory_items%ROWTYPE;
    v_previous_quantity INTEGER;
    v_new_quantity INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Get item details
    SELECT * INTO v_item FROM inventory_items WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found');
    END IF;
    
    -- Calculate new quantity
    v_previous_quantity := v_item.stock_quantity;
    v_new_quantity := v_previous_quantity + p_quantity;
    
    -- Update cost price if provided
    IF p_cost_price IS NOT NULL THEN
        UPDATE inventory_items 
        SET cost_price = p_cost_price,
            supplier = COALESCE(p_supplier, supplier),
            updated_at = NOW()
        WHERE id = p_item_id;
    END IF;
    
    -- Insert transaction record
    INSERT INTO inventory_transactions (
        inventory_item_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        unit_price,
        total_amount,
        notes,
        recorded_by
    ) VALUES (
        p_item_id,
        'restock',
        p_quantity,
        v_previous_quantity,
        v_new_quantity,
        p_cost_price,
        p_cost_price * p_quantity,
        p_notes,
        p_recorded_by
    ) RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'new_stock', v_new_quantity
    );
END;
$$ LANGUAGE plpgsql;

-- Insert some sample inventory items
INSERT INTO inventory_items (name, category, stock_quantity, unit_price, cost_price, supplier, is_redeemable, points_required, is_vip_only, is_promo_active) VALUES
('Coca Cola 500ml', 'Drink', 50, 80.00, 60.00, 'Coca Cola Kenya', false, 0, false, false),
('Crispy Chicken Wings', 'Snack', 30, 350.00, 250.00, 'Local Supplier', false, 0, false, true),
('Gaming Headset', 'Equipment', 5, 2500.00, 1800.00, 'Tech Distributor', true, 2500, true, false),
('Free Hour Voucher', 'Voucher', 20, 0.00, 0.00, 'Internal', true, 500, false, false),
('Energy Drink', 'Drink', 25, 120.00, 90.00, 'Energy Drinks Ltd', false, 0, false, false),
('Pizza Slice', 'Snack', 15, 200.00, 150.00, 'Local Supplier', false, 0, false, true),
('Gaming Mouse', 'Equipment', 8, 1800.00, 1200.00, 'Tech Distributor', true, 1800, true, false),
('VIP Session Pass', 'Voucher', 10, 0.00, 0.00, 'Internal', true, 1000, true, false);

-- Grant necessary permissions
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON inventory_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION process_inventory_sale(UUID, INTEGER, UUID, UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_inventory_restock(UUID, INTEGER, NUMERIC, TEXT, TEXT, UUID) TO authenticated;