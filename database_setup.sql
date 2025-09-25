-- ================================================================
-- COMPLETE DATABASE SETUP FOR INFINITY GAMING POS SYSTEM
-- ================================================================
-- Execute this entire script in your Supabase SQL Editor to set up:
-- 1. Core user management and authentication
-- 2. Gaming sessions and station management  
-- 3. Customer management and loyalty program
-- 4. Complete inventory management system
-- 5. All required RLS policies and functions
-- ================================================================

-- ================================
-- 1. CORE USER MANAGEMENT
-- ================================

-- Create users table for role-based access
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'supervisor')) DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. AUTO-CREATE USER RECORD ON SIGNUP
-- ================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'cashier');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================
-- 3. ENABLE RLS AND CREATE POLICIES
-- ================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read their own user record" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own record" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON public.users;

-- Allow authenticated users to read their own user record
CREATE POLICY "Allow authenticated users to read their own user record" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow authenticated users to update their own record
CREATE POLICY "Allow authenticated users to update their own record" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Allow service role to manage all users (for admin operations)
CREATE POLICY "Allow service role full access to users" 
ON public.users 
FOR ALL 
TO service_role 
USING (true);

-- ================================
-- 4. INSERT CURRENT USER AS ADMIN
-- ================================
INSERT INTO public.users (id, email, full_name, role) 
VALUES (
    '4ef13982-e1db-425c-8714-bc735146040b', 
    (SELECT email FROM auth.users WHERE id = '4ef13982-e1db-425c-8714-bc735146040b'), 
    'System Administrator',
    'admin'
) 
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- ================================
-- 5. GAMING STATIONS AND GAMES
-- ================================

-- Gaming stations table
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    station_type TEXT NOT NULL CHECK (station_type IN ('PC', 'PlayStation', 'Xbox', 'Nintendo', 'VR')),
    hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate > 0),
    is_active BOOLEAN DEFAULT TRUE,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    platform TEXT NOT NULL,
    esrb_rating TEXT CHECK (esrb_rating IN ('E', 'E10+', 'T', 'M', 'AO', 'RP')),
    is_multiplayer BOOLEAN DEFAULT FALSE,
    max_players INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stations and games
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Policies for stations and games
CREATE POLICY "Allow authenticated users to view stations" ON public.stations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to view games" ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins and supervisors to manage stations" ON public.stations FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);
CREATE POLICY "Allow admins and supervisors to manage games" ON public.games FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- ================================
-- 6. CUSTOMER MANAGEMENT
-- ================================

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    dob DATE,
    loyalty_points NUMERIC(10,2) DEFAULT 0 CHECK (loyalty_points >= 0),
    loyalty_tier TEXT DEFAULT 'Bronze' CHECK (loyalty_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'bonus', 'adjustment')),
    points NUMERIC(10,2) NOT NULL,
    description TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for customer tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Customer policies
CREATE POLICY "Allow authenticated users to manage customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage loyalty transactions" ON public.loyalty_transactions FOR ALL TO authenticated USING (true);

-- ================================
-- 7. GAMING SESSIONS MANAGEMENT
-- ================================

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    secondary_customer_id UUID REFERENCES public.customers(id),
    station_id UUID REFERENCES public.stations(id),
    game_id UUID REFERENCES public.games(id),
    session_type TEXT NOT NULL CHECK (session_type IN ('hourly', 'package', 'tournament', 'special')) DEFAULT 'hourly',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    hourly_rate NUMERIC(10,2),
    base_amount NUMERIC(10,2) DEFAULT 0,
    additional_charges NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'mpesa', 'split')),
    mpesa_transaction_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage sessions" ON public.sessions FOR ALL TO authenticated USING (true);

-- ================================
-- 8. INVENTORY MANAGEMENT SYSTEM
-- ================================

-- Inventory items table
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

-- Inventory transactions table for tracking stock changes
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

-- Enable RLS for inventory tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Inventory policies
CREATE POLICY "Allow authenticated users to read inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage inventory_items" ON public.inventory_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage inventory_transactions" ON public.inventory_transactions FOR ALL TO authenticated USING (true);

-- ================================
-- 9. FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update loyalty tier based on points
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Update loyalty tier based on points
    IF NEW.loyalty_points >= 1000 THEN
        NEW.loyalty_tier = 'Platinum';
    ELSIF NEW.loyalty_points >= 500 THEN
        NEW.loyalty_tier = 'Gold';
    ELSIF NEW.loyalty_points >= 200 THEN
        NEW.loyalty_tier = 'Silver';
    ELSE
        NEW.loyalty_tier = 'Bronze';
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for loyalty tier updates
DROP TRIGGER IF EXISTS trigger_update_loyalty_tier ON public.customers;
CREATE TRIGGER trigger_update_loyalty_tier
    BEFORE UPDATE OF loyalty_points ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_tier();

-- Function to update inventory stock after transactions
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

-- Trigger for automatic stock updates
DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON public.inventory_transactions;
CREATE TRIGGER trigger_update_inventory_stock
    AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_stock();

-- Function to calculate session totals
CREATE OR REPLACE FUNCTION calculate_session_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = COALESCE(NEW.base_amount, 0) + COALESCE(NEW.additional_charges, 0) - COALESCE(NEW.discount_amount, 0);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for session total calculation
DROP TRIGGER IF EXISTS trigger_calculate_session_total ON public.sessions;
CREATE TRIGGER trigger_calculate_session_total
    BEFORE INSERT OR UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_session_total();

-- ================================
-- 10. UTILITY FUNCTIONS
-- ================================

-- Function to get dashboard stats (used by dashboard)
CREATE OR REPLACE FUNCTION get_dashboard_stats_today()
RETURNS TABLE(
    activeSessionsCount INTEGER,
    todaysRevenue NUMERIC,
    totalCustomersCount INTEGER,
    newCustomersCount INTEGER,
    avgTransactionValue NUMERIC,
    totalLoyaltyPoints NUMERIC,
    avgSessionDurationMins NUMERIC,
    loyaltyPointsToday NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.sessions WHERE payment_status = 'pending') as activeSessionsCount,
        (SELECT COALESCE(SUM(total_amount), 0) FROM public.sessions WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid') as todaysRevenue,
        (SELECT COUNT(*)::INTEGER FROM public.customers) as totalCustomersCount,
        (SELECT COUNT(*)::INTEGER FROM public.customers WHERE DATE(created_at) = CURRENT_DATE) as newCustomersCount,
        (SELECT COALESCE(AVG(total_amount), 0) FROM public.sessions WHERE payment_status = 'paid') as avgTransactionValue,
        (SELECT COALESCE(SUM(loyalty_points), 0) FROM public.customers) as totalLoyaltyPoints,
        (SELECT COALESCE(AVG(duration_minutes), 0) FROM public.sessions WHERE end_time IS NOT NULL) as avgSessionDurationMins,
        (SELECT COALESCE(SUM(points), 0) FROM public.loyalty_transactions WHERE DATE(created_at) = CURRENT_DATE AND transaction_type = 'earned') as loyaltyPointsToday;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 11. INSERT SAMPLE DATA
-- ================================

-- Insert sample stations
INSERT INTO public.stations (name, station_type, hourly_rate, specifications) VALUES
('Gaming PC 1', 'PC', 100.00, '{"cpu": "Intel i7", "gpu": "RTX 3070", "ram": "16GB"}'),
('Gaming PC 2', 'PC', 100.00, '{"cpu": "Intel i7", "gpu": "RTX 3060", "ram": "16GB"}'),
('PlayStation 5 - Station 1', 'PlayStation', 80.00, '{"model": "PS5", "controllers": 2}'),
('PlayStation 5 - Station 2', 'PlayStation', 80.00, '{"model": "PS5", "controllers": 2}'),
('Xbox Series X', 'Xbox', 80.00, '{"model": "Series X", "controllers": 2}'),
('Nintendo Switch', 'Nintendo', 60.00, '{"model": "OLED", "controllers": 2}'),
('VR Station', 'VR', 150.00, '{"headset": "Meta Quest 3", "space": "4x4m"}')
ON CONFLICT DO NOTHING;

-- Insert sample games
INSERT INTO public.games (title, genre, platform, esrb_rating, is_multiplayer, max_players) VALUES
('Fortnite', 'Battle Royale', 'PC', 'T', true, 100),
('FIFA 24', 'Sports', 'PlayStation', 'E', true, 4),
('Call of Duty: Modern Warfare', 'FPS', 'PC', 'M', true, 32),
('Minecraft', 'Sandbox', 'PC', 'E10+', true, 8),
('Grand Theft Auto V', 'Action', 'PC', 'M', true, 30),
('Rocket League', 'Sports', 'PlayStation', 'E', true, 8),
('Among Us', 'Social Deduction', 'PC', 'E10+', true, 10),
('Super Smash Bros Ultimate', 'Fighting', 'Nintendo', 'E10+', true, 8),
('Beat Saber', 'Rhythm', 'VR', 'E', false, 1),
('Half-Life: Alyx', 'Action', 'VR', 'M', false, 1)
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO public.customers (full_name, phone_number, email, dob, loyalty_points, loyalty_tier) VALUES
('John Doe', '+254712345678', 'john.doe@email.com', '1995-06-15', 250, 'Silver'),
('Jane Smith', '+254723456789', 'jane.smith@email.com', '1998-03-22', 450, 'Silver'),
('Mike Johnson', '+254734567890', 'mike.j@email.com', '1992-11-08', 750, 'Gold'),
('Sarah Wilson', '+254745678901', 'sarah.w@email.com', '2000-01-12', 150, 'Bronze'),
('David Brown', '+254756789012', 'david.b@email.com', '1988-09-30', 1200, 'Platinum')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert sample inventory items
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
('VIP Membership Card', 'Voucher', 20, 1000.00, 0.00, true, 2000, true)
ON CONFLICT DO NOTHING;

-- ================================
-- SETUP COMPLETE!
-- ================================
-- Your database is now fully configured with:
-- ✓ User management and authentication (with auto-signup trigger)
-- ✓ Gaming stations and games
-- ✓ Customer management and loyalty system
-- ✓ Session management and payments
-- ✓ Complete inventory management system
-- ✓ All RLS policies and security
-- ✓ Utility functions and triggers
-- ✓ Sample data for testing
-- 
-- You can now use the Infinity Gaming POS system!
-- ================================