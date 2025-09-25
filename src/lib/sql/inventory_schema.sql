-- Inventory schema for Infinity Gaming Lounge POS
-- Tables: inventory_items, inventory_transactions
-- Functions: adjust_inventory_stock, prevent_negative_stock
-- Policies: RLS for authenticated users

-- Enable uuid-ossp if needed (Supabase generally has gen_random_uuid via pgcrypto)
-- create extension if not exists "uuid-ossp";

-- 1) inventory_items
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher')),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unit_price numeric not null check (unit_price >= 0),
  cost_price numeric,
  supplier text,
  expiry_date date,
  is_redeemable boolean not null default false,
  points_required numeric not null default 0 check (points_required >= 0),
  is_vip_only boolean not null default false,
  is_promo_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_category_idx on public.inventory_items (category);
create index if not exists inventory_items_expiry_idx on public.inventory_items (expiry_date);

-- 2) inventory_transactions: log all adjustments
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  change_type text not null check (change_type in ('add', 'sale', 'adjustment', 'redeem')),
  quantity_change integer not null,
  unit_price_at_time numeric,
  session_id uuid, -- optional link to sessions
  payer_customer_id uuid, -- optional who paid/redeemed
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists inventory_tx_item_idx on public.inventory_transactions (item_id);
create index if not exists inventory_tx_session_idx on public.inventory_transactions (session_id);

-- 3) Helper function: adjust_inventory_stock
create or replace function public.adjust_inventory_stock(p_item_id uuid, p_quantity_change integer)
returns void
language plpgsql
as $$
begin
  update public.inventory_items
    set stock_quantity = stock_quantity + p_quantity_change,
        updated_at = now()
  where id = p_item_id;

  -- Prevent negative stock
  if (select stock_quantity from public.inventory_items where id = p_item_id) < 0 then
    raise exception 'Insufficient stock for item %', p_item_id using errcode = 'P0001';
  end if;
end;
$$;

-- 4) Trigger to prevent negative stock on direct updates
create or replace function public.prevent_negative_stock()
returns trigger
language plpgsql
as $$
begin
  if new.stock_quantity < 0 then
    raise exception 'Stock cannot be negative' using errcode = 'P0001';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_non_negative on public.inventory_items;
create trigger trg_inventory_items_non_negative
before update on public.inventory_items
for each row
execute function public.prevent_negative_stock();

-- 5) RLS
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;

-- Allow read to authenticated
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_items' and policyname = 'Inventory items read'
  ) then
    create policy "Inventory items read" on public.inventory_items
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_transactions' and policyname = 'Inventory tx read'
  ) then
    create policy "Inventory tx read" on public.inventory_transactions
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- Allow insert/update/delete to authenticated (tighten as needed per roles)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_items' and policyname = 'Inventory items write'
  ) then
    create policy "Inventory items write" on public.inventory_items
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_transactions' and policyname = 'Inventory tx write'
  ) then
    create policy "Inventory tx write" on public.inventory_transactions
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

-- 6) Optional: function to log a transaction and adjust stock atomically
create or replace function public.log_inventory_change(
  p_item_id uuid,
  p_change_type text,
  p_quantity integer,
  p_unit_price numeric default null,
  p_session_id uuid default null,
  p_payer_customer_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_tx_id uuid;
begin
  -- insert transaction
  insert into public.inventory_transactions (
    item_id, change_type, quantity_change, unit_price_at_time, session_id, payer_customer_id, notes, created_by
  ) values (
    p_item_id, p_change_type, p_quantity, p_unit_price, p_session_id, p_payer_customer_id, p_notes, auth.uid()
  ) returning id into v_tx_id;

  -- adjust stock
  perform public.adjust_inventory_stock(p_item_id, p_quantity);

  return v_tx_id;
end;
$$;

