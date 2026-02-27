-- Kitchen Display System (KDS) schema for Supabase
-- Status flow: new -> prep -> ready

begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_status'
      and n.nspname = 'public'
  ) then
    create type public.order_status as enum ('new', 'prep', 'ready');
  end if;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  status public.order_status not null default 'new',
  placed_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  ready_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  modifiers text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_status_placed_at_idx
  on public.orders (status, placed_at);

create index if not exists order_items_order_position_idx
  on public.order_items (order_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create or replace function public.set_order_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'new' then
    new.started_at := null;
    new.ready_at := null;
  elsif new.status = 'prep' then
    if new.started_at is null then
      new.started_at := timezone('utc', now());
    end if;
    new.ready_at := null;
  elsif new.status = 'ready' then
    if new.started_at is null then
      new.started_at := timezone('utc', now());
    end if;
    new.ready_at := timezone('utc', now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_status_timestamps on public.orders;
create trigger trg_orders_status_timestamps
before update of status on public.orders
for each row
execute function public.set_order_status_timestamps();

alter table public.orders replica identity full;
alter table public.order_items replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.order_items;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "kds_read_orders" on public.orders;
create policy "kds_read_orders"
  on public.orders
  for select
  to anon, authenticated
  using (true);

drop policy if exists "kds_update_order_status" on public.orders;
create policy "kds_update_order_status"
  on public.orders
  for update
  to anon, authenticated
  using (true)
  with check (status in ('new', 'prep', 'ready'));

drop policy if exists "kds_read_order_items" on public.order_items;
create policy "kds_read_order_items"
  on public.order_items
  for select
  to anon, authenticated
  using (true);

commit;
