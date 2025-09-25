-- Inventory schema for Infinity Gaming Lounge POS
-- Run in Supabase SQL editor or via migrations

-- inventory_items table
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  category text not null check (category in ('Snack','Drink','Merchandise','Equipment','Voucher')),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unit_price numeric not null check (unit_price >= 0),
  cost_price numeric,
  supplier text,
  expiry_date date,
  is_redeemable boolean not null default false,
  points_required numeric not null default 0 check (points_required >= 0),
  is_vip_only boolean not null default false,
  is_promo_active boolean not null default false
);

create index if not exists idx_inventory_items_category on public.inventory_items(category);
create index if not exists idx_inventory_items_expiry on public.inventory_items(expiry_date);

-- inventory_transactions table
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity integer not null,
  transaction_type text not null check (transaction_type in ('restock','sale','adjustment','redeem')),
  unit_price numeric,
  note text,
  session_id uuid,
  customer_id uuid
);

create index if not exists idx_inventory_transactions_item on public.inventory_transactions(item_id);
create index if not exists idx_inventory_transactions_created on public.inventory_transactions(created_at);

-- trigger to auto-update updated_at on inventory_items
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

-- Function to adjust stock with safeguards (positive for restock, negative for sale)
create or replace function public.adjust_inventory_stock(p_item_id uuid, p_delta integer, p_type text, p_unit_price numeric, p_note text, p_session_id uuid, p_customer_id uuid)
returns void as $$
declare
  current_qty integer;
begin
  select stock_quantity into current_qty from public.inventory_items where id = p_item_id for update;
  if current_qty is null then
    raise exception 'Item % not found', p_item_id;
  end if;
  if p_delta < 0 and current_qty + p_delta < 0 then
    raise exception 'Insufficient stock for item %', p_item_id;
  end if;
  update public.inventory_items set stock_quantity = current_qty + p_delta where id = p_item_id;
  insert into public.inventory_transactions (item_id, quantity, transaction_type, unit_price, note, session_id, customer_id)
  values (p_item_id, abs(p_delta), p_type, p_unit_price, p_note, p_session_id, p_customer_id);
end;
$$ language plpgsql;

