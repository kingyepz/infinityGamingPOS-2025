-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher')),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC(10,2) CHECK (cost_price >= 0),
    supplier TEXT,
    expiry_date DATE,
    is_redeemable BOOLEAN NOT NULL DEFAULT false,
    points_required NUMERIC(10,0) DEFAULT 0 CHECK (points_required >= 0),
    is_vip_only BOOLEAN NOT NULL DEFAULT false,
    is_promo_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_transactions table for stock tracking
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'return', 'expired')),
    quantity_change INTEGER NOT NULL, -- Negative for sales/expired, positive for restock
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_price NUMERIC(10,2), -- Price at time of transaction (for sales)
    total_amount NUMERIC(10,2), -- Total value of transaction
    session_id UUID, -- Reference to game session if sold during session
    customer_id UUID, -- Customer who purchased (if applicable)
    payment_method TEXT CHECK (payment_method IN ('cash', 'mpesa', 'mpesa-stk', 'loyalty_points')),
    loyalty_points_used NUMERIC(10,0) DEFAULT 0,
    notes TEXT,
    recorded_by UUID, -- Staff member who recorded transaction
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock_quantity ON inventory_items(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_promo_active ON inventory_items(is_promo_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_redeemable ON inventory_items(is_redeemable);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry_date ON inventory_items(expiry_date);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_session_id ON inventory_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_customer_id ON inventory_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Create trigger to update updated_at timestamp
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

-- Create function to safely update stock quantities with validation
CREATE OR REPLACE FUNCTION update_inventory_stock(
    p_item_id UUID,
    p_quantity_change INTEGER,
    p_transaction_type TEXT,
    p_unit_price NUMERIC DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL,
    p_loyalty_points_used NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_recorded_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
    v_item_price NUMERIC;
    v_total_amount NUMERIC;
    v_transaction_id UUID;
BEGIN
    -- Get current stock and price
    SELECT stock_quantity, unit_price 
    INTO v_current_stock, v_item_price
    FROM inventory_items 
    WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found');
    END IF;
    
    -- Calculate new stock
    v_new_stock := v_current_stock + p_quantity_change;
    
    -- Validate stock doesn't go negative
    IF v_new_stock < 0 THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    
    -- Use provided price or default to item price
    v_item_price := COALESCE(p_unit_price, v_item_price);
    v_total_amount := ABS(p_quantity_change) * v_item_price;
    
    -- Update inventory stock
    UPDATE inventory_items 
    SET stock_quantity = v_new_stock 
    WHERE id = p_item_id;
    
    -- Record transaction
    INSERT INTO inventory_transactions (
        item_id, transaction_type, quantity_change, quantity_before, 
        quantity_after, unit_price, total_amount, session_id, customer_id,
        payment_method, loyalty_points_used, notes, recorded_by
    ) VALUES (
        p_item_id, p_transaction_type, p_quantity_change, v_current_stock,
        v_new_stock, v_item_price, v_total_amount, p_session_id, p_customer_id,
        p_payment_method, p_loyalty_points_used, p_notes, p_recorded_by
    ) RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'success', true, 
        'transaction_id', v_transaction_id,
        'old_stock', v_current_stock,
        'new_stock', v_new_stock
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items(p_threshold INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    stock_quantity INTEGER,
    unit_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.name, i.category, i.stock_quantity, i.unit_price
    FROM inventory_items i
    WHERE i.stock_quantity <= p_threshold
    ORDER BY i.stock_quantity ASC, i.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get expiring items
CREATE OR REPLACE FUNCTION get_expiring_items(p_days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    stock_quantity INTEGER,
    expiry_date DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id, i.name, i.category, i.stock_quantity, i.expiry_date,
        (i.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry
    FROM inventory_items i
    WHERE i.expiry_date IS NOT NULL 
    AND i.expiry_date <= CURRENT_DATE + INTERVAL '%s days' % p_days_ahead
    AND i.stock_quantity > 0
    ORDER BY i.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get inventory analytics
CREATE OR REPLACE FUNCTION get_inventory_analytics()
RETURNS JSON AS $$
DECLARE
    v_total_items INTEGER;
    v_total_value NUMERIC;
    v_low_stock_count INTEGER;
    v_expiring_count INTEGER;
    v_promo_items_count INTEGER;
    v_top_selling_items JSON;
BEGIN
    -- Get basic counts
    SELECT COUNT(*), SUM(stock_quantity * unit_price)
    INTO v_total_items, v_total_value
    FROM inventory_items;
    
    -- Get low stock count
    SELECT COUNT(*)
    INTO v_low_stock_count
    FROM inventory_items
    WHERE stock_quantity <= 5;
    
    -- Get expiring items count
    SELECT COUNT(*)
    INTO v_expiring_count
    FROM inventory_items
    WHERE expiry_date IS NOT NULL 
    AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
    AND stock_quantity > 0;
    
    -- Get promo items count
    SELECT COUNT(*)
    INTO v_promo_items_count
    FROM inventory_items
    WHERE is_promo_active = true;
    
    -- Get top selling items (last 30 days)
    SELECT json_agg(
        json_build_object(
            'name', i.name,
            'total_sold', -SUM(it.quantity_change),
            'revenue', SUM(it.total_amount)
        ) ORDER BY -SUM(it.quantity_change) DESC
    )
    INTO v_top_selling_items
    FROM inventory_items i
    JOIN inventory_transactions it ON i.id = it.item_id
    WHERE it.transaction_type = 'sale'
    AND it.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY i.id, i.name
    LIMIT 5;
    
    RETURN json_build_object(
        'total_items', v_total_items,
        'total_value', v_total_value,
        'low_stock_count', v_low_stock_count,
        'expiring_count', v_expiring_count,
        'promo_items_count', v_promo_items_count,
        'top_selling_items', COALESCE(v_top_selling_items, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql;

-- Insert sample inventory data
INSERT INTO inventory_items (name, category, stock_quantity, unit_price, cost_price, supplier, is_redeemable, points_required, is_vip_only, is_promo_active) VALUES
('Coca-Cola 500ml', 'Drink', 50, 80.00, 45.00, 'Coca-Cola Kenya', false, 0, false, false),
('Sprite 500ml', 'Drink', 30, 80.00, 45.00, 'Coca-Cola Kenya', false, 0, false, true),
('Water 500ml', 'Drink', 100, 50.00, 25.00, 'Aquafina', true, 100, false, false),
('Pringles Original', 'Snack', 25, 250.00, 180.00, 'Kelloggs', false, 0, false, false),
('Doritos Nacho Cheese', 'Snack', 20, 120.00, 80.00, 'PepsiCo', true, 300, false, true),
('Gaming Headset Pro', 'Merchandise', 5, 5000.00, 3500.00, 'TechSupplier Ltd', false, 0, true, false),
('Gaming Mouse Pad XL', 'Merchandise', 15, 1200.00, 800.00, 'TechSupplier Ltd', true, 2500, false, false),
('1-Hour Free Play Voucher', 'Voucher', 10, 0.00, 0.00, NULL, true, 500, false, true),
('VIP Lounge Access', 'Voucher', 5, 0.00, 0.00, NULL, true, 1000, true, false),
('Energy Drink Red Bull', 'Drink', 40, 200.00, 140.00, 'Red Bull Kenya', false, 0, false, false);