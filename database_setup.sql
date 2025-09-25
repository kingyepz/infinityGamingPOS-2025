-- Infinity Gaming Lounge POS - Database Setup
-- Run this in your Supabase SQL Editor

-- ================================
-- 1. CREATE USERS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'supervisor', 'cashier')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ================================
-- 3. CREATE RLS POLICIES FOR USERS TABLE
-- ================================

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
-- 4. CREATE FUNCTION TO AUTO-CREATE USER RECORD ON SIGNUP
-- ================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'cashier');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 5. CREATE TRIGGER FOR AUTO-USER CREATION
-- ================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================
-- 6. INSERT YOUR CURRENT USER (REPLACE WITH YOUR ACTUAL USER ID)
-- ================================
-- First, find your user ID by running: SELECT id, email FROM auth.users;
-- Then replace 'YOUR_USER_ID_HERE' with your actual UUID

INSERT INTO public.users (id, email, role) 
VALUES (
    '4ef13982-e1db-425c-8714-bc735146040b', 
    (SELECT email FROM auth.users WHERE id = '4ef13982-e1db-425c-8714-bc735146040b'), 
    'admin'
) 
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = NOW();

-- ================================
-- 7. CREATE OTHER REQUIRED TABLES (if they don't exist)
-- ================================

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    dob DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (for gaming sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    station_id UUID,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    amount DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paid')),
    payment_method TEXT,
    mpesa_reference TEXT,
    mpesa_checkout_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stations table (gaming stations)
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    hourly_rate DECIMAL(10,2) DEFAULT 100.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    transaction_type TEXT CHECK (transaction_type IN ('earned', 'redeemed', 'bonus')),
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer offers table
CREATE TABLE IF NOT EXISTS public.customer_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    type TEXT NOT NULL,
    value DECIMAL(10,2),
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 8. ENABLE RLS ON ALL TABLES
-- ================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_offers ENABLE ROW LEVEL SECURITY;

-- ================================
-- 9. CREATE BASIC RLS POLICIES FOR OTHER TABLES
-- ================================

-- Allow authenticated users to read all data (adjust as needed for your security requirements)
CREATE POLICY "Allow authenticated users to read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage customers" ON public.customers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage sessions" ON public.sessions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read stations" ON public.stations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage stations" ON public.stations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read loyalty_transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage loyalty_transactions" ON public.loyalty_transactions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read customer_offers" ON public.customer_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage customer_offers" ON public.customer_offers FOR ALL TO authenticated USING (true);

-- ================================
-- SETUP COMPLETE!
-- ================================
-- After running this SQL:
-- 1. Your user (4ef13982-e1db-425c-8714-bc735146040b) will be set as 'admin'
-- 2. Future signups will automatically get 'cashier' role
-- 3. All RLS policies will be properly configured
-- 4. The login error should be resolved