-- Kitchen Display System (KDS) production data architecture for Supabase.
-- Scope:
--   * multi-screen realtime-ready model
--   * station-aware access control
--   * status transition safety
--   * immutable order audit trail

begin;

create extension if not exists pgcrypto;

-------------------------------------------------------------------------------
-- 1) ENUM TYPES
-------------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_status'
      and n.nspname = 'public'
  ) then
    create type public.order_status as enum ('new', 'prep', 'ready', 'served', 'cancelled');
  end if;
end $$;

alter type public.order_status add value if not exists 'served';
alter type public.order_status add value if not exists 'cancelled';

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_source'
      and n.nspname = 'public'
  ) then
    create type public.order_source as enum ('pos', 'web', 'kiosk', 'phone', 'third_party');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_priority'
      and n.nspname = 'public'
  ) then
    create type public.order_priority as enum ('normal', 'rush', 'vip');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_event_type'
      and n.nspname = 'public'
  ) then
    create type public.order_event_type as enum (
      'order_created',
      'moved_to_prep',
      'moved_to_ready',
      'moved_back',
      'cancelled',
      'served',
      'note_updated',
      'station_reassigned'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'staff_role'
      and n.nspname = 'public'
  ) then
    create type public.staff_role as enum ('viewer', 'cook', 'expediter', 'manager', 'admin', 'integration');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'session_status'
      and n.nspname = 'public'
  ) then
    create type public.session_status as enum ('active', 'inactive', 'ended', 'stale');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'station_assignment_role'
      and n.nspname = 'public'
  ) then
    create type public.station_assignment_role as enum ('primary', 'secondary');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'kds_severity'
      and n.nspname = 'public'
  ) then
    create type public.kds_severity as enum ('info', 'warn', 'error', 'critical');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'kds_anomaly_status'
      and n.nspname = 'public'
  ) then
    create type public.kds_anomaly_status as enum ('open', 'acknowledged', 'resolved', 'false_positive');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'kds_incident_status'
      and n.nspname = 'public'
  ) then
    create type public.kds_incident_status as enum ('open', 'investigating', 'mitigated', 'resolved', 'postmortem');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'kds_recovery_status'
      and n.nspname = 'public'
  ) then
    create type public.kds_recovery_status as enum ('pending', 'running', 'success', 'failed');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'kds_command_result'
      and n.nspname = 'public'
  ) then
    create type public.kds_command_result as enum ('accepted', 'rejected', 'failed', 'duplicate', 'noop');
  end if;
end $$;

-------------------------------------------------------------------------------
-- 2) CORE CONFIG TABLES
-------------------------------------------------------------------------------

create table if not exists public.kitchen_stations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  zone_type text not null default 'general',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  accepts_orders boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

insert into public.kitchen_stations (code, name, zone_type, sort_order)
values
  ('general', 'General Line', 'general', 0),
  ('grill', 'Grill', 'hot', 10),
  ('fryer', 'Fryer', 'hot', 20),
  ('assembly', 'Assembly', 'pass', 30),
  ('drinks', 'Drinks', 'cold', 40)
on conflict (code) do nothing;

create or replace function public.default_station_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.kitchen_stations
  where is_active = true
    and archived_at is null
  order by sort_order, id
  limit 1
$$;

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.staff_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.staff_station_memberships (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references public.staff_profiles(user_id) on delete cascade,
  station_id uuid not null references public.kitchen_stations(id) on delete cascade,
  can_view boolean not null default true,
  can_update_status boolean not null default true,
  can_manage_station boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (staff_user_id, station_id)
);

-------------------------------------------------------------------------------
-- 3) ORDERS, ITEMS, MODIFIERS
-------------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_date date not null default (timezone('utc', now()))::date,
  order_number bigint generated by default as identity,
  external_order_id text,
  status public.order_status not null default 'new',
  source public.order_source not null default 'pos',
  priority public.order_priority not null default 'normal',
  station_id uuid not null references public.kitchen_stations(id),
  placed_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  cancelled_at timestamptz,
  special_instructions text,
  state_version bigint not null default 1,
  last_command_id uuid,
  created_by uuid references public.staff_profiles(user_id),
  updated_by uuid references public.staff_profiles(user_id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  unique (business_date, order_number)
);

-- Backward-compatible evolution for existing "orders" table.
alter table public.orders add column if not exists business_date date;
alter table public.orders add column if not exists external_order_id text;
alter table public.orders add column if not exists source public.order_source;
alter table public.orders add column if not exists priority public.order_priority;
alter table public.orders add column if not exists served_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists station_id uuid;
alter table public.orders add column if not exists special_instructions text;
alter table public.orders add column if not exists state_version bigint not null default 1;
alter table public.orders add column if not exists last_command_id uuid;
alter table public.orders add column if not exists created_by uuid;
alter table public.orders add column if not exists updated_by uuid;
alter table public.orders add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.orders add column if not exists archived_at timestamptz;

alter table public.orders
  alter column status type public.order_status using status::text::public.order_status;

alter table public.orders
  alter column source set default 'pos',
  alter column priority set default 'normal',
  alter column placed_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'order_number'
      and is_identity = 'YES'
      and identity_generation = 'ALWAYS'
  ) then
    alter table public.orders alter column order_number set generated by default;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_station_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_station_id_fkey
      foreign key (station_id) references public.kitchen_stations(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_created_by_fkey'
  ) then
    alter table public.orders
      add constraint orders_created_by_fkey
      foreign key (created_by) references public.staff_profiles(user_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_updated_by_fkey'
  ) then
    alter table public.orders
      add constraint orders_updated_by_fkey
      foreign key (updated_by) references public.staff_profiles(user_id);
  end if;
end $$;

update public.orders
set business_date = coalesce(business_date, (placed_at at time zone 'utc')::date)
where business_date is null;

update public.orders
set source = coalesce(source, 'pos')
where source is null;

update public.orders
set priority = coalesce(priority, 'normal')
where priority is null;

update public.orders
set station_id = coalesce(station_id, public.default_station_id())
where station_id is null;

alter table public.orders alter column business_date set not null;
alter table public.orders alter column source set not null;
alter table public.orders alter column priority set not null;
alter table public.orders alter column station_id set not null;
alter table public.orders alter column station_id set default public.default_station_id();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_business_date_order_number_key'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_business_date_order_number_key
      unique (business_date, order_number);
  end if;
end $$;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  line_number integer not null,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  station_id uuid references public.kitchen_stations(id),
  item_status text,
  kitchen_note text,
  modifiers text[] not null default '{}',
  position integer not null default 0,
  voided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (order_id, line_number)
);

-- Backward-compatible evolution for existing "order_items" table.
alter table public.order_items add column if not exists line_number integer;
alter table public.order_items add column if not exists station_id uuid;
alter table public.order_items add column if not exists item_status text;
alter table public.order_items add column if not exists kitchen_note text;
alter table public.order_items add column if not exists voided_at timestamptz;
alter table public.order_items add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'order_items_station_id_fkey'
  ) then
    alter table public.order_items
      add constraint order_items_station_id_fkey
      foreign key (station_id) references public.kitchen_stations(id);
  end if;
end $$;

with ranked as (
  select
    id,
    row_number() over (
      partition by order_id
      order by coalesce(line_number, position, 2147483647), created_at, id
    ) as rn
  from public.order_items
)
update public.order_items oi
set line_number = ranked.rn
from ranked
where oi.id = ranked.id
  and (oi.line_number is null or oi.line_number <> ranked.rn);

alter table public.order_items alter column line_number set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_order_id_line_number_key'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_order_id_line_number_key
      unique (order_id, line_number);
  end if;
end $$;

create table if not exists public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_code text,
  modifier_name text not null,
  modifier_value text,
  modifier_type text not null default 'custom',
  position smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (order_item_id, modifier_name, position)
);

-- Seed normalized modifiers from legacy order_items.modifiers text[].
insert into public.order_item_modifiers (
  order_item_id,
  modifier_name,
  modifier_type,
  position
)
select
  oi.id,
  m.modifier_name,
  'custom',
  m.position::smallint
from public.order_items oi
cross join lateral unnest(oi.modifiers) with ordinality as m(modifier_name, position)
on conflict (order_item_id, modifier_name, position) do nothing;

-------------------------------------------------------------------------------
-- 4) STATION ROUTING, SESSIONS, EVENTS
-------------------------------------------------------------------------------

create table if not exists public.order_station_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  station_id uuid not null references public.kitchen_stations(id) on delete restrict,
  assignment_role public.station_assignment_role not null default 'secondary',
  assigned_at timestamptz not null default timezone('utc', now()),
  released_at timestamptz,
  assigned_by uuid references public.staff_profiles(user_id),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (order_id, station_id, assignment_role)
);

create table if not exists public.kitchen_sessions (
  id uuid primary key default gen_random_uuid(),
  device_uid text not null,
  device_label text,
  station_id uuid references public.kitchen_stations(id) on delete set null,
  staff_user_id uuid references public.staff_profiles(user_id) on delete set null,
  status public.session_status not null default 'active',
  started_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  ip_address inet,
  app_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  event_type public.order_event_type not null,
  from_status public.order_status,
  to_status public.order_status,
  station_id uuid references public.kitchen_stations(id) on delete set null,
  actor_user_id uuid references public.staff_profiles(user_id) on delete set null,
  actor_session_id uuid references public.kitchen_sessions(id) on delete set null,
  actor_type text not null default 'user',
  reason_code text,
  command_id uuid,
  trace_id uuid,
  version_after bigint not null default 1,
  event_origin text not null default 'trigger',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.order_events add column if not exists command_id uuid;
alter table public.order_events add column if not exists trace_id uuid;
alter table public.order_events add column if not exists version_after bigint not null default 1;
alter table public.order_events add column if not exists event_origin text not null default 'trigger';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_events_actor_type_check'
      and conrelid = 'public.order_events'::regclass
  ) then
    alter table public.order_events
      add constraint order_events_actor_type_check
      check (actor_type in ('user', 'system', 'api', 'device'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_events_event_origin_check'
      and conrelid = 'public.order_events'::regclass
  ) then
    alter table public.order_events
      add constraint order_events_event_origin_check
      check (event_origin in ('rpc', 'trigger', 'system', 'recovery'));
  end if;
end $$;

with ranked as (
  select
    id,
    row_number() over (partition by order_id order by created_at, id) as rn
  from public.order_events
)
update public.order_events oe
set version_after = ranked.rn
from ranked
where oe.id = ranked.id
  and (oe.version_after is null or oe.version_after <> ranked.rn);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'order_events_order_id_version_after_key'
      and conrelid = 'public.order_events'::regclass
  ) then
    alter table public.order_events
      drop constraint order_events_order_id_version_after_key;
  end if;
end $$;

-------------------------------------------------------------------------------
-- 4b) OBSERVABILITY, INCIDENTS, RECOVERY
-------------------------------------------------------------------------------

create table if not exists public.kds_command_log (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null,
  order_id uuid references public.orders(id) on delete set null,
  command_type text not null,
  requested_to_status public.order_status,
  expected_version bigint,
  actor_user_id uuid references public.staff_profiles(user_id) on delete set null,
  actor_session_id uuid references public.kitchen_sessions(id) on delete set null,
  received_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  finished_at timestamptz,
  result public.kds_command_result not null default 'accepted',
  error_class text,
  error_code text,
  error_message text,
  error_context jsonb not null default '{}'::jsonb,
  latency_ms integer,
  retry_count integer not null default 0
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_last_command_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_last_command_id_fkey
      foreign key (last_command_id) references public.kds_command_log(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_events_command_id_fkey'
      and conrelid = 'public.order_events'::regclass
  ) then
    alter table public.order_events
      add constraint order_events_command_id_fkey
      foreign key (command_id) references public.kds_command_log(id) on delete set null;
  end if;
end $$;

create table if not exists public.kds_technical_events (
  id bigint generated always as identity primary key,
  severity public.kds_severity not null default 'info',
  component text not null,
  event_name text not null,
  trace_id uuid,
  command_id uuid references public.kds_command_log(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  session_id uuid references public.kitchen_sessions(id) on delete set null,
  actor_user_id uuid references public.staff_profiles(user_id) on delete set null,
  error_class text,
  error_code text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kds_client_heartbeats (
  session_id uuid primary key references public.kitchen_sessions(id) on delete cascade,
  station_id uuid not null references public.kitchen_stations(id) on delete cascade,
  screen_name text,
  build_version text,
  connection_state text not null default 'connecting',
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_realtime_event_at timestamptz,
  last_full_sync_at timestamptz,
  max_order_version_seen bigint not null default 0,
  board_checksum text,
  active_counts jsonb not null default '{}'::jsonb,
  client_time timestamptz,
  clock_skew_ms integer,
  last_error_code text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kds_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity public.kds_severity not null default 'warn',
  status public.kds_incident_status not null default 'open',
  detected_at timestamptz not null default timezone('utc', now()),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  owner_user_id uuid references public.staff_profiles(user_id) on delete set null,
  summary text,
  impact jsonb not null default '{}'::jsonb,
  root_cause text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kds_anomalies (
  id bigint generated always as identity primary key,
  anomaly_type text not null,
  severity public.kds_severity not null default 'warn',
  status public.kds_anomaly_status not null default 'open',
  detected_at timestamptz not null default timezone('utc', now()),
  detector_name text not null default 'manual',
  order_id uuid references public.orders(id) on delete set null,
  station_id uuid references public.kitchen_stations(id) on delete set null,
  session_id uuid references public.kitchen_sessions(id) on delete set null,
  trace_id uuid,
  expected_state jsonb not null default '{}'::jsonb,
  observed_state jsonb not null default '{}'::jsonb,
  incident_id uuid references public.kds_incidents(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kds_incident_timeline (
  id bigint generated always as identity primary key,
  incident_id uuid not null references public.kds_incidents(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references public.staff_profiles(user_id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kds_recovery_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.kds_incidents(id) on delete set null,
  action_type text not null,
  target_order_id uuid references public.orders(id) on delete set null,
  target_session_id uuid references public.kitchen_sessions(id) on delete set null,
  requested_by uuid references public.staff_profiles(user_id) on delete set null,
  requested_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  finished_at timestamptz,
  status public.kds_recovery_status not null default 'pending',
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  error text
);

-------------------------------------------------------------------------------
-- 5) INDEXES
-------------------------------------------------------------------------------

create index if not exists kitchen_stations_active_sort_idx
  on public.kitchen_stations (is_active, sort_order);

create index if not exists staff_memberships_staff_station_idx
  on public.staff_station_memberships (staff_user_id, station_id);

create index if not exists orders_board_idx
  on public.orders (station_id, status, priority, placed_at);

create index if not exists orders_active_board_idx
  on public.orders (station_id, status, placed_at)
  where archived_at is null
    and cancelled_at is null
    and served_at is null;

create index if not exists orders_external_order_id_idx
  on public.orders (external_order_id)
  where external_order_id is not null;

create index if not exists order_items_order_line_idx
  on public.order_items (order_id, line_number);

create index if not exists order_items_station_idx
  on public.order_items (station_id)
  where station_id is not null;

create index if not exists order_item_modifiers_item_pos_idx
  on public.order_item_modifiers (order_item_id, position);

create index if not exists order_item_modifiers_name_idx
  on public.order_item_modifiers (modifier_name);

create index if not exists order_station_assignments_order_idx
  on public.order_station_assignments (order_id, assigned_at desc);

create index if not exists kitchen_sessions_status_seen_idx
  on public.kitchen_sessions (status, last_seen_at desc);

create index if not exists order_events_order_created_idx
  on public.order_events (order_id, created_at desc);

create index if not exists order_events_station_created_idx
  on public.order_events (station_id, created_at desc);

create index if not exists order_events_type_created_idx
  on public.order_events (event_type, created_at desc);

create index if not exists order_events_command_id_idx
  on public.order_events (command_id)
  where command_id is not null;

create index if not exists order_events_order_version_idx
  on public.order_events (order_id, version_after desc);

create index if not exists orders_state_version_idx
  on public.orders (id, state_version);

create index if not exists kds_command_log_order_received_idx
  on public.kds_command_log (order_id, received_at desc);

create index if not exists kds_command_log_result_received_idx
  on public.kds_command_log (result, received_at desc);

create index if not exists kds_command_log_session_received_idx
  on public.kds_command_log (actor_session_id, received_at desc)
  where actor_session_id is not null;

create index if not exists kds_technical_events_severity_created_idx
  on public.kds_technical_events (severity, created_at desc);

create index if not exists kds_technical_events_component_created_idx
  on public.kds_technical_events (component, created_at desc);

create index if not exists kds_technical_events_order_created_idx
  on public.kds_technical_events (order_id, created_at desc)
  where order_id is not null;

create index if not exists kds_client_heartbeats_station_seen_idx
  on public.kds_client_heartbeats (station_id, last_seen_at desc);

create index if not exists kds_anomalies_status_severity_detected_idx
  on public.kds_anomalies (status, severity, detected_at desc);

create index if not exists kds_anomalies_order_detected_idx
  on public.kds_anomalies (order_id, detected_at desc)
  where order_id is not null;

create index if not exists kds_incidents_status_detected_idx
  on public.kds_incidents (status, detected_at desc);

create index if not exists kds_recovery_actions_status_requested_idx
  on public.kds_recovery_actions (status, requested_at desc);

-------------------------------------------------------------------------------
-- 6) SHARED TRIGGER FUNCTIONS
-------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_jwt_role()
returns text
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '')
$$;

create or replace function public.current_staff_role()
returns public.staff_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.staff_role;
begin
  if auth.uid() is null then
    return 'viewer';
  end if;

  select role
  into v_role
  from public.staff_profiles
  where user_id = auth.uid()
    and is_active = true
    and archived_at is null
  limit 1;

  return coalesce(v_role, 'viewer');
end;
$$;

create or replace function public.is_privileged_role()
returns boolean
language sql
stable
as $$
  select public.current_staff_role() in ('manager', 'admin', 'integration')
      or public.current_jwt_role() = 'service_role'
$$;

create or replace function public.current_actor_type()
returns text
language plpgsql
stable
as $$
begin
  if auth.uid() is not null then
    return 'user';
  end if;

  if public.current_jwt_role() = 'service_role' then
    return 'api';
  end if;

  return 'system';
end;
$$;

create or replace function public.current_kds_session_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_raw text;
begin
  v_raw := nullif(current_setting('app.kds_session_id', true), '');
  if v_raw is null then
    return null;
  end if;

  begin
    return v_raw::uuid;
  exception when others then
    return null;
  end;
end;
$$;

create or replace function public.current_reason_code()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.kds_reason_code', true), '')
$$;

create or replace function public.current_command_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_raw text;
begin
  v_raw := nullif(current_setting('app.kds_command_id', true), '');
  if v_raw is null then
    return null;
  end if;

  begin
    return v_raw::uuid;
  exception when others then
    return null;
  end;
end;
$$;

create or replace function public.current_trace_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_raw text;
begin
  v_raw := nullif(current_setting('app.kds_trace_id', true), '');
  if v_raw is null then
    return null;
  end if;

  begin
    return v_raw::uuid;
  exception when others then
    return null;
  end;
end;
$$;

create or replace function public.can_view_station(p_station_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_station_id is null then
    return false;
  end if;

  if public.is_privileged_role() then
    return true;
  end if;

  return exists (
    select 1
    from public.staff_station_memberships ssm
    join public.kitchen_stations ks on ks.id = ssm.station_id
    where ssm.staff_user_id = auth.uid()
      and ssm.station_id = p_station_id
      and ssm.can_view = true
      and ks.is_active = true
      and ks.archived_at is null
  );
end;
$$;

create or replace function public.can_update_station_status(p_station_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_station_id is null then
    return false;
  end if;

  if public.is_privileged_role() then
    return true;
  end if;

  return exists (
    select 1
    from public.staff_station_memberships ssm
    join public.kitchen_stations ks on ks.id = ssm.station_id
    where ssm.staff_user_id = auth.uid()
      and ssm.station_id = p_station_id
      and ssm.can_update_status = true
      and ks.is_active = true
      and ks.archived_at is null
  );
end;
$$;

create or replace function public.can_manage_station(p_station_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_station_id is null then
    return false;
  end if;

  if public.is_privileged_role() then
    return true;
  end if;

  return exists (
    select 1
    from public.staff_station_memberships ssm
    where ssm.staff_user_id = auth.uid()
      and ssm.station_id = p_station_id
      and ssm.can_manage_station = true
  );
end;
$$;

create or replace function public.is_valid_order_transition(
  p_from_status public.order_status,
  p_to_status public.order_status
)
returns boolean
language sql
immutable
as $$
  select case
    when p_from_status = p_to_status then true
    when p_from_status = 'new' and p_to_status in ('prep', 'cancelled') then true
    when p_from_status = 'prep' and p_to_status in ('ready', 'new', 'cancelled') then true
    when p_from_status = 'ready' and p_to_status in ('served', 'prep', 'cancelled') then true
    else false
  end
$$;

create or replace function public.map_order_event_type(
  p_from_status public.order_status,
  p_to_status public.order_status
)
returns public.order_event_type
language plpgsql
immutable
as $$
begin
  if p_to_status = 'prep' and p_from_status = 'new' then
    return 'moved_to_prep';
  elsif p_to_status = 'ready' then
    return 'moved_to_ready';
  elsif p_to_status = 'served' then
    return 'served';
  elsif p_to_status = 'cancelled' then
    return 'cancelled';
  elsif p_to_status in ('new', 'prep') then
    return 'moved_back';
  end if;

  return 'moved_back';
end;
$$;

-------------------------------------------------------------------------------
-- 6b) RPC / SERVICE FUNCTIONS (SAFE WRITE ENTRYPOINTS)
-------------------------------------------------------------------------------

create or replace function public.kds_touch_kitchen_session(
  p_session_id uuid default null,
  p_device_uid text default null,
  p_device_label text default null,
  p_station_id uuid default null,
  p_app_version text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.kitchen_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.kitchen_sessions%rowtype;
begin
  if v_user_id is null and public.current_jwt_role() <> 'service_role' then
    raise exception 'authentication required';
  end if;

  if p_station_id is not null then
    if not exists (
      select 1
      from public.kitchen_stations ks
      where ks.id = p_station_id
        and ks.is_active = true
        and ks.archived_at is null
    ) then
      raise exception 'invalid or inactive station_id';
    end if;
  end if;

  if p_session_id is not null then
    select *
    into v_session
    from public.kitchen_sessions
    where id = p_session_id
    limit 1;

    if found then
      if not (
        public.is_privileged_role()
        or v_session.staff_user_id = v_user_id
        or v_session.staff_user_id is null
      ) then
        raise exception 'session does not belong to current user';
      end if;

      update public.kitchen_sessions
      set
        device_uid = coalesce(p_device_uid, v_session.device_uid),
        device_label = coalesce(p_device_label, v_session.device_label),
        station_id = coalesce(p_station_id, v_session.station_id),
        app_version = coalesce(p_app_version, v_session.app_version),
        metadata = coalesce(p_metadata, v_session.metadata),
        status = 'active',
        last_seen_at = timezone('utc', now()),
        ended_at = null,
        staff_user_id = coalesce(v_session.staff_user_id, v_user_id)
      where id = p_session_id
      returning * into v_session;

      return v_session;
    end if;
  end if;

  if p_device_uid is null or btrim(p_device_uid) = '' then
    raise exception 'device_uid is required when creating a new kitchen session';
  end if;

  insert into public.kitchen_sessions (
    device_uid,
    device_label,
    station_id,
    staff_user_id,
    status,
    started_at,
    last_seen_at,
    app_version,
    metadata
  )
  values (
    p_device_uid,
    p_device_label,
    p_station_id,
    v_user_id,
    'active',
    timezone('utc', now()),
    timezone('utc', now()),
    p_app_version,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_session;

  return v_session;
end;
$$;

create or replace function public.kds_move_order_status(
  p_order_id uuid,
  p_to_status public.order_status,
  p_reason_code text default null,
  p_actor_session_id uuid default null,
  p_expected_updated_at timestamptz default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.orders%rowtype;
  v_updated public.orders%rowtype;
  v_command_id uuid := gen_random_uuid();
  v_trace_id uuid := gen_random_uuid();
  v_received_at timestamptz := timezone('utc', now());
  v_started_at timestamptz;
  v_finished_at timestamptz;
begin
  if auth.uid() is null and public.current_jwt_role() <> 'service_role' then
    raise exception 'authentication required';
  end if;

  insert into public.kds_command_log (
    id,
    trace_id,
    order_id,
    command_type,
    requested_to_status,
    actor_user_id,
    actor_session_id,
    received_at,
    result
  )
  values (
    v_command_id,
    v_trace_id,
    p_order_id,
    'move_status',
    p_to_status,
    auth.uid(),
    p_actor_session_id,
    v_received_at,
    'accepted'
  );

  v_started_at := timezone('utc', now());
  update public.kds_command_log
  set started_at = v_started_at
  where id = v_command_id;

  select *
  into v_current
  from public.orders
  where id = p_order_id
    and archived_at is null
  for update;

  if not found then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      result = 'rejected',
      error_class = 'business_validation',
      error_code = 'ORDER_NOT_FOUND',
      error_message = 'order not found'
    where id = v_command_id;
    raise exception 'order not found';
  end if;

  if p_expected_updated_at is not null
     and v_current.updated_at is distinct from p_expected_updated_at then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'rejected',
      error_class = 'conflict',
      error_code = 'STALE_STATE',
      error_message = 'order was updated by another process'
    where id = v_command_id;
    raise exception 'order was updated by another process';
  end if;

  if not (
    public.is_privileged_role()
    or public.can_update_station_status(v_current.station_id)
  ) then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'rejected',
      error_class = 'auth',
      error_code = 'FORBIDDEN_STATION',
      error_message = 'you are not allowed to update status for this station'
    where id = v_command_id;
    raise exception 'you are not allowed to update status for this station';
  end if;

  if not public.is_valid_order_transition(v_current.status, p_to_status) then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'rejected',
      error_class = 'business_validation',
      error_code = 'INVALID_TRANSITION',
      error_message = format('invalid order status transition: %s -> %s', v_current.status, p_to_status)
    where id = v_command_id;
    raise exception 'invalid order status transition: % -> %', v_current.status, p_to_status;
  end if;

  if p_to_status = 'cancelled'
     and (p_reason_code is null or btrim(p_reason_code) = '') then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'rejected',
      error_class = 'business_validation',
      error_code = 'MISSING_REASON',
      error_message = 'reason_code is required for cancelled status'
    where id = v_command_id;
    raise exception 'reason_code is required for cancelled status';
  end if;

  if v_current.status = p_to_status then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'noop',
      error_class = null,
      error_code = null,
      error_message = null
    where id = v_command_id;
    return v_current;
  end if;

  perform set_config('app.kds_command_id', v_command_id::text, true);
  perform set_config('app.kds_trace_id', v_trace_id::text, true);

  if p_actor_session_id is not null then
    perform set_config('app.kds_session_id', p_actor_session_id::text, true);
  end if;

  if p_reason_code is not null and btrim(p_reason_code) <> '' then
    perform set_config('app.kds_reason_code', btrim(p_reason_code), true);
  end if;

  update public.orders
  set status = p_to_status
  where id = p_order_id
  returning * into v_updated;

  v_finished_at := timezone('utc', now());
  update public.kds_command_log
  set
    finished_at = v_finished_at,
    latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
    expected_version = v_current.state_version,
    result = 'accepted',
    error_class = null,
    error_code = null,
    error_message = null
  where id = v_command_id;

  return v_updated;
exception
  when others then
    v_finished_at := timezone('utc', now());

    update public.kds_command_log
    set
      finished_at = coalesce(finished_at, v_finished_at),
      latency_ms = coalesce(latency_ms, (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer),
      result = case when result in ('rejected', 'noop') then result else 'failed' end,
      error_class = coalesce(error_class, 'system'),
      error_code = coalesce(error_code, sqlstate),
      error_message = coalesce(error_message, sqlerrm),
      error_context = error_context || jsonb_build_object(
        'order_id', p_order_id,
        'requested_to_status', p_to_status
      )
    where id = v_command_id;

    insert into public.kds_technical_events (
      severity,
      component,
      event_name,
      trace_id,
      command_id,
      order_id,
      session_id,
      actor_user_id,
      error_class,
      error_code,
      message,
      payload
    )
    values (
      'error',
      'rpc',
      'kds_move_order_status_failed',
      v_trace_id,
      v_command_id,
      p_order_id,
      p_actor_session_id,
      auth.uid(),
      'system',
      sqlstate,
      sqlerrm,
      jsonb_build_object('requested_to_status', p_to_status)
    );

    raise;
end;
$$;

create or replace function public.kds_update_order_note(
  p_order_id uuid,
  p_special_instructions text,
  p_reason_code text default null,
  p_actor_session_id uuid default null,
  p_expected_updated_at timestamptz default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.orders%rowtype;
  v_updated public.orders%rowtype;
  v_command_id uuid := gen_random_uuid();
  v_trace_id uuid := gen_random_uuid();
  v_received_at timestamptz := timezone('utc', now());
  v_finished_at timestamptz;
begin
  if auth.uid() is null and public.current_jwt_role() <> 'service_role' then
    raise exception 'authentication required';
  end if;

  insert into public.kds_command_log (
    id,
    trace_id,
    order_id,
    command_type,
    actor_user_id,
    actor_session_id,
    received_at,
    result
  )
  values (
    v_command_id,
    v_trace_id,
    p_order_id,
    'update_note',
    auth.uid(),
    p_actor_session_id,
    v_received_at,
    'accepted'
  );

  update public.kds_command_log
  set started_at = timezone('utc', now())
  where id = v_command_id;

  select *
  into v_current
  from public.orders
  where id = p_order_id
    and archived_at is null
  for update;

  if not found then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      result = 'rejected',
      error_class = 'business_validation',
      error_code = 'ORDER_NOT_FOUND',
      error_message = 'order not found'
    where id = v_command_id;
    raise exception 'order not found';
  end if;

  if p_expected_updated_at is not null
     and v_current.updated_at is distinct from p_expected_updated_at then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'rejected',
      error_class = 'conflict',
      error_code = 'STALE_STATE',
      error_message = 'order was updated by another process'
    where id = v_command_id;
    raise exception 'order was updated by another process';
  end if;

  if not (
    public.is_privileged_role()
    or public.can_update_station_status(v_current.station_id)
  ) then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = v_finished_at,
      latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
      expected_version = v_current.state_version,
      result = 'rejected',
      error_class = 'auth',
      error_code = 'FORBIDDEN_STATION',
      error_message = 'you are not allowed to update note for this station'
    where id = v_command_id;
    raise exception 'you are not allowed to update note for this station';
  end if;

  perform set_config('app.kds_command_id', v_command_id::text, true);
  perform set_config('app.kds_trace_id', v_trace_id::text, true);

  if p_actor_session_id is not null then
    perform set_config('app.kds_session_id', p_actor_session_id::text, true);
  end if;

  if p_reason_code is not null and btrim(p_reason_code) <> '' then
    perform set_config('app.kds_reason_code', btrim(p_reason_code), true);
  end if;

  update public.orders
  set special_instructions = p_special_instructions
  where id = p_order_id
  returning * into v_updated;

  v_finished_at := timezone('utc', now());
  update public.kds_command_log
  set
    finished_at = v_finished_at,
    latency_ms = (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer,
    expected_version = v_current.state_version,
    result = case
      when v_current.special_instructions is not distinct from p_special_instructions then 'noop'
      else 'accepted'
    end
  where id = v_command_id;

  return v_updated;
exception
  when others then
    v_finished_at := timezone('utc', now());
    update public.kds_command_log
    set
      finished_at = coalesce(finished_at, v_finished_at),
      latency_ms = coalesce(latency_ms, (extract(epoch from (v_finished_at - v_received_at)) * 1000)::integer),
      result = case when result in ('rejected', 'noop') then result else 'failed' end,
      error_class = coalesce(error_class, 'system'),
      error_code = coalesce(error_code, sqlstate),
      error_message = coalesce(error_message, sqlerrm),
      error_context = error_context || jsonb_build_object('order_id', p_order_id)
    where id = v_command_id;

    insert into public.kds_technical_events (
      severity,
      component,
      event_name,
      trace_id,
      command_id,
      order_id,
      session_id,
      actor_user_id,
      error_class,
      error_code,
      message
    )
    values (
      'error',
      'rpc',
      'kds_update_order_note_failed',
      v_trace_id,
      v_command_id,
      p_order_id,
      p_actor_session_id,
      auth.uid(),
      'system',
      sqlstate,
      sqlerrm
    );

    raise;
end;
$$;

revoke all on function public.kds_touch_kitchen_session(uuid, text, text, uuid, text, jsonb) from public;
grant execute on function public.kds_touch_kitchen_session(uuid, text, text, uuid, text, jsonb) to authenticated, service_role;

revoke all on function public.kds_move_order_status(uuid, public.order_status, text, uuid, timestamptz) from public;
grant execute on function public.kds_move_order_status(uuid, public.order_status, text, uuid, timestamptz) to authenticated, service_role;

revoke all on function public.kds_update_order_note(uuid, text, text, uuid, timestamptz) from public;
grant execute on function public.kds_update_order_note(uuid, text, text, uuid, timestamptz) to authenticated, service_role;

create or replace function public.kds_log_technical_event(
  p_severity public.kds_severity,
  p_component text,
  p_event_name text,
  p_message text default null,
  p_payload jsonb default '{}'::jsonb,
  p_order_id uuid default null,
  p_session_id uuid default null,
  p_command_id uuid default null,
  p_trace_id uuid default null,
  p_error_class text default null,
  p_error_code text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if auth.uid() is null and public.current_jwt_role() <> 'service_role' then
    raise exception 'authentication required';
  end if;

  insert into public.kds_technical_events (
    severity,
    component,
    event_name,
    trace_id,
    command_id,
    order_id,
    session_id,
    actor_user_id,
    error_class,
    error_code,
    message,
    payload
  )
  values (
    coalesce(p_severity, 'info'),
    p_component,
    p_event_name,
    coalesce(p_trace_id, public.current_trace_id()),
    coalesce(p_command_id, public.current_command_id()),
    p_order_id,
    coalesce(p_session_id, public.current_kds_session_id()),
    auth.uid(),
    p_error_class,
    p_error_code,
    p_message,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.kds_report_client_heartbeat(
  p_session_id uuid,
  p_station_id uuid,
  p_connection_state text,
  p_max_order_version_seen bigint default 0,
  p_board_checksum text default null,
  p_active_counts jsonb default '{}'::jsonb,
  p_last_error_code text default null,
  p_details jsonb default '{}'::jsonb,
  p_client_time timestamptz default null
)
returns public.kds_client_heartbeats
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.kds_client_heartbeats%rowtype;
  v_session public.kitchen_sessions%rowtype;
  v_clock_skew integer;
begin
  if auth.uid() is null and public.current_jwt_role() <> 'service_role' then
    raise exception 'authentication required';
  end if;

  select *
  into v_session
  from public.kitchen_sessions
  where id = p_session_id
  limit 1;

  if not found then
    raise exception 'session not found';
  end if;

  if not (
    public.is_privileged_role()
    or v_session.staff_user_id = auth.uid()
    or v_session.staff_user_id is null
  ) then
    raise exception 'session does not belong to current user';
  end if;

  if p_client_time is null then
    v_clock_skew := null;
  else
    v_clock_skew := extract(epoch from (timezone('utc', now()) - p_client_time))::integer * 1000;
  end if;

  insert into public.kds_client_heartbeats (
    session_id,
    station_id,
    connection_state,
    max_order_version_seen,
    board_checksum,
    active_counts,
    last_error_code,
    details,
    client_time,
    clock_skew_ms,
    last_seen_at,
    last_realtime_event_at,
    updated_at
  )
  values (
    p_session_id,
    p_station_id,
    coalesce(p_connection_state, 'connecting'),
    greatest(coalesce(p_max_order_version_seen, 0), 0),
    p_board_checksum,
    coalesce(p_active_counts, '{}'::jsonb),
    p_last_error_code,
    coalesce(p_details, '{}'::jsonb),
    p_client_time,
    v_clock_skew,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (session_id) do update
  set
    station_id = excluded.station_id,
    connection_state = excluded.connection_state,
    max_order_version_seen = excluded.max_order_version_seen,
    board_checksum = excluded.board_checksum,
    active_counts = excluded.active_counts,
    last_error_code = excluded.last_error_code,
    details = excluded.details,
    client_time = excluded.client_time,
    clock_skew_ms = excluded.clock_skew_ms,
    last_seen_at = timezone('utc', now()),
    last_realtime_event_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  returning * into v_row;

  update public.kitchen_sessions
  set
    last_seen_at = timezone('utc', now()),
    status = 'active'
  where id = p_session_id;

  return v_row;
end;
$$;

create or replace function public.kds_run_basic_consistency_scan()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duplicate_count integer := 0;
  v_stale_session_count integer := 0;
  v_divergence_count integer := 0;
begin
  -- Duplicate active orders by business_date + order_number.
  with duplicates as (
    select business_date, order_number
    from public.orders
    where archived_at is null
      and status in ('new', 'prep', 'ready')
    group by business_date, order_number
    having count(*) > 1
  )
  insert into public.kds_anomalies (
    anomaly_type,
    severity,
    status,
    detector_name,
    expected_state,
    observed_state
  )
  select
    'duplicate_order',
    'critical',
    'open',
    'kds_run_basic_consistency_scan',
    jsonb_build_object('uniqueness', 'business_date+order_number should be unique in active set'),
    jsonb_build_object('business_date', d.business_date, 'order_number', d.order_number)
  from duplicates d
  where not exists (
    select 1
    from public.kds_anomalies a
    where a.anomaly_type = 'duplicate_order'
      and a.status in ('open', 'acknowledged')
      and a.observed_state ->> 'business_date' = d.business_date::text
      and a.observed_state ->> 'order_number' = d.order_number::text
  );

  get diagnostics v_duplicate_count = row_count;

  -- Stale client sessions (no heartbeat > 45s).
  insert into public.kds_anomalies (
    anomaly_type,
    severity,
    status,
    detector_name,
    station_id,
    session_id,
    expected_state,
    observed_state
  )
  select
    'stale_snapshot',
    'error',
    'open',
    'kds_run_basic_consistency_scan',
    hb.station_id,
    hb.session_id,
    jsonb_build_object('heartbeat_max_age_sec', 45),
    jsonb_build_object('last_seen_at', hb.last_seen_at, 'connection_state', hb.connection_state)
  from public.kds_client_heartbeats hb
  where hb.last_seen_at < timezone('utc', now()) - interval '45 seconds'
    and not exists (
      select 1
      from public.kds_anomalies a
      where a.anomaly_type = 'stale_snapshot'
        and a.status in ('open', 'acknowledged')
        and a.session_id = hb.session_id
    );

  get diagnostics v_stale_session_count = row_count;

  -- Station divergence by checksum mismatch on active sessions.
  with station_checksums as (
    select
      station_id,
      count(distinct board_checksum) as checksum_variants
    from public.kds_client_heartbeats
    where connection_state = 'live'
      and last_seen_at >= timezone('utc', now()) - interval '45 seconds'
      and board_checksum is not null
    group by station_id
    having count(distinct board_checksum) > 1
  )
  insert into public.kds_anomalies (
    anomaly_type,
    severity,
    status,
    detector_name,
    station_id,
    expected_state,
    observed_state
  )
  select
    'screen_divergence',
    'critical',
    'open',
    'kds_run_basic_consistency_scan',
    sc.station_id,
    jsonb_build_object('checksum_variants', 1),
    jsonb_build_object('checksum_variants', sc.checksum_variants)
  from station_checksums sc
  where not exists (
    select 1
    from public.kds_anomalies a
    where a.anomaly_type = 'screen_divergence'
      and a.status in ('open', 'acknowledged')
      and a.station_id = sc.station_id
  );

  get diagnostics v_divergence_count = row_count;

  return jsonb_build_object(
    'inserted_duplicates', v_duplicate_count,
    'inserted_stale_sessions', v_stale_session_count,
    'inserted_divergence', v_divergence_count,
    'open_anomalies',
      (
        select count(*)
        from public.kds_anomalies
        where status in ('open', 'acknowledged')
      )
  );
end;
$$;

create or replace function public.kds_create_incident_from_open_anomalies(
  p_title text,
  p_severity public.kds_severity default 'error',
  p_summary text default null
)
returns public.kds_incidents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident public.kds_incidents%rowtype;
begin
  if auth.uid() is null and public.current_jwt_role() <> 'service_role' then
    raise exception 'authentication required';
  end if;

  if not (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin')) then
    raise exception 'incident creation requires manager role';
  end if;

  insert into public.kds_incidents (
    title,
    severity,
    status,
    detected_at,
    owner_user_id,
    summary,
    impact
  )
  values (
    p_title,
    coalesce(p_severity, 'error'),
    'open',
    timezone('utc', now()),
    auth.uid(),
    p_summary,
    jsonb_build_object(
      'open_anomaly_count',
      (
        select count(*)
        from public.kds_anomalies
        where status in ('open', 'acknowledged')
      )
    )
  )
  returning * into v_incident;

  update public.kds_anomalies
  set
    incident_id = v_incident.id,
    status = case when status = 'open' then 'acknowledged' else status end,
    updated_at = timezone('utc', now())
  where status in ('open', 'acknowledged')
    and incident_id is null;

  insert into public.kds_incident_timeline (
    incident_id,
    event_type,
    actor_user_id,
    details
  )
  values (
    v_incident.id,
    'incident_created',
    auth.uid(),
    jsonb_build_object('summary', p_summary)
  );

  return v_incident;
end;
$$;

revoke all on function public.kds_log_technical_event(public.kds_severity, text, text, text, jsonb, uuid, uuid, uuid, uuid, text, text) from public;
grant execute on function public.kds_log_technical_event(public.kds_severity, text, text, text, jsonb, uuid, uuid, uuid, uuid, text, text) to authenticated, service_role;

revoke all on function public.kds_report_client_heartbeat(uuid, uuid, text, bigint, text, jsonb, text, jsonb, timestamptz) from public;
grant execute on function public.kds_report_client_heartbeat(uuid, uuid, text, bigint, text, jsonb, text, jsonb, timestamptz) to authenticated, service_role;

revoke all on function public.kds_run_basic_consistency_scan() from public;
grant execute on function public.kds_run_basic_consistency_scan() to authenticated, service_role;

revoke all on function public.kds_create_incident_from_open_anomalies(text, public.kds_severity, text) from public;
grant execute on function public.kds_create_incident_from_open_anomalies(text, public.kds_severity, text) to authenticated, service_role;

-------------------------------------------------------------------------------
-- 7) BUSINESS RULE TRIGGERS
-------------------------------------------------------------------------------

create or replace function public.prepare_order_on_insert()
returns trigger
language plpgsql
as $$
declare
  v_command_id uuid := public.current_command_id();
begin
  if new.placed_at is null then
    new.placed_at := timezone('utc', now());
  end if;

  if new.business_date is null then
    new.business_date := (new.placed_at at time zone 'utc')::date;
  end if;

  if new.station_id is null then
    new.station_id := public.default_station_id();
  end if;

  if auth.uid() is not null then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
  end if;

  if new.state_version is null or new.state_version < 1 then
    new.state_version := 1;
  end if;

  if v_command_id is not null then
    new.last_command_id := v_command_id;
  end if;

  new.updated_at := timezone('utc', now());

  if new.status = 'prep' then
    new.started_at := coalesce(new.started_at, timezone('utc', now()));
  elsif new.status = 'ready' then
    new.started_at := coalesce(new.started_at, timezone('utc', now()));
    new.ready_at := coalesce(new.ready_at, timezone('utc', now()));
  elsif new.status = 'served' then
    new.started_at := coalesce(new.started_at, timezone('utc', now()));
    new.ready_at := coalesce(new.ready_at, timezone('utc', now()));
    new.served_at := coalesce(new.served_at, timezone('utc', now()));
  elsif new.status = 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, timezone('utc', now()));
  end if;

  return new;
end;
$$;

create or replace function public.apply_order_business_rules()
returns trigger
language plpgsql
as $$
declare
  v_command_id uuid := public.current_command_id();
  v_business_change boolean := false;
begin
  new.updated_at := timezone('utc', now());

  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;

  if new.station_id is distinct from old.station_id then
    v_business_change := true;
    if not (
      public.is_privileged_role()
      or public.can_manage_station(old.station_id)
      or public.can_manage_station(new.station_id)
    ) then
      raise exception 'station reassignment requires manager privileges';
    end if;
  end if;

  if new.status is distinct from old.status then
    v_business_change := true;
    if not public.is_valid_order_transition(old.status, new.status) then
      raise exception 'invalid order status transition: % -> %', old.status, new.status;
    end if;

    if not (
      public.is_privileged_role()
      or public.can_update_station_status(old.station_id)
      or public.can_update_station_status(new.station_id)
    ) then
      raise exception 'you are not allowed to update status for this station';
    end if;

    if new.status = 'new' then
      new.started_at := null;
      new.ready_at := null;
      new.served_at := null;
      new.cancelled_at := null;
    elsif new.status = 'prep' then
      new.started_at := coalesce(new.started_at, timezone('utc', now()));
      new.ready_at := null;
      new.served_at := null;
      new.cancelled_at := null;
    elsif new.status = 'ready' then
      new.started_at := coalesce(new.started_at, timezone('utc', now()));
      new.ready_at := timezone('utc', now());
      new.served_at := null;
      new.cancelled_at := null;
    elsif new.status = 'served' then
      new.started_at := coalesce(new.started_at, timezone('utc', now()));
      new.ready_at := coalesce(new.ready_at, timezone('utc', now()));
      new.served_at := timezone('utc', now());
      new.cancelled_at := null;
    elsif new.status = 'cancelled' then
      new.cancelled_at := timezone('utc', now());
      new.served_at := null;
    end if;
  end if;

  if new.special_instructions is distinct from old.special_instructions then
    v_business_change := true;
  end if;

  if v_business_change then
    new.state_version := coalesce(old.state_version, 1) + 1;
    if v_command_id is not null then
      new.last_command_id := v_command_id;
    end if;
  else
    new.state_version := coalesce(old.state_version, 1);
    new.last_command_id := coalesce(old.last_command_id, new.last_command_id);
  end if;

  return new;
end;
$$;

create or replace function public.log_order_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_actor_session_id uuid := public.current_kds_session_id();
  v_actor_type text := public.current_actor_type();
  v_reason_code text := public.current_reason_code();
  v_command_id uuid := public.current_command_id();
  v_trace_id uuid := public.current_trace_id();
  v_event_origin text := case
    when public.current_command_id() is not null then 'rpc'
    else 'trigger'
  end;
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (
      order_id,
      event_type,
      to_status,
      station_id,
      actor_user_id,
      actor_session_id,
      actor_type,
      reason_code,
      command_id,
      trace_id,
      version_after,
      event_origin,
      payload
    )
    values (
      new.id,
      'order_created',
      new.status,
      new.station_id,
      v_actor_user_id,
      v_actor_session_id,
      v_actor_type,
      v_reason_code,
      v_command_id,
      v_trace_id,
      coalesce(new.state_version, 1),
      v_event_origin,
      jsonb_build_object(
        'source', new.source,
        'priority', new.priority
      )
    );

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_events (
      order_id,
      event_type,
      from_status,
      to_status,
      station_id,
      actor_user_id,
      actor_session_id,
      actor_type,
      reason_code,
      command_id,
      trace_id,
      version_after,
      event_origin,
      payload
    )
    values (
      new.id,
      public.map_order_event_type(old.status, new.status),
      old.status,
      new.status,
      new.station_id,
      v_actor_user_id,
      v_actor_session_id,
      v_actor_type,
      v_reason_code,
      v_command_id,
      v_trace_id,
      coalesce(new.state_version, 1),
      v_event_origin,
      jsonb_build_object(
        'priority', new.priority,
        'source', new.source
      )
    );
  end if;

  if new.station_id is distinct from old.station_id then
    insert into public.order_events (
      order_id,
      event_type,
      station_id,
      actor_user_id,
      actor_session_id,
      actor_type,
      reason_code,
      command_id,
      trace_id,
      version_after,
      event_origin,
      payload
    )
    values (
      new.id,
      'station_reassigned',
      new.station_id,
      v_actor_user_id,
      v_actor_session_id,
      v_actor_type,
      v_reason_code,
      v_command_id,
      v_trace_id,
      coalesce(new.state_version, 1),
      v_event_origin,
      jsonb_build_object(
        'from_station_id', old.station_id,
        'to_station_id', new.station_id
      )
    );
  end if;

  if new.special_instructions is distinct from old.special_instructions then
    insert into public.order_events (
      order_id,
      event_type,
      station_id,
      actor_user_id,
      actor_session_id,
      actor_type,
      reason_code,
      command_id,
      trace_id,
      version_after,
      event_origin,
      payload
    )
    values (
      new.id,
      'note_updated',
      new.station_id,
      v_actor_user_id,
      v_actor_session_id,
      v_actor_type,
      v_reason_code,
      v_command_id,
      v_trace_id,
      coalesce(new.state_version, 1),
      v_event_origin,
      jsonb_build_object(
        'old_note', old.special_instructions,
        'new_note', new.special_instructions
      )
    );
  end if;

  return new;
end;
$$;

create or replace function public.assign_order_item_line_number()
returns trigger
language plpgsql
as $$
begin
  if new.line_number is null then
    select coalesce(max(line_number), 0) + 1
    into new.line_number
    from public.order_items
    where order_id = new.order_id;
  end if;

  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

-- Compatibility sync:
-- keep legacy order_items.modifiers array and normalized order_item_modifiers rows
-- synchronized in both directions until frontend/ingestion fully migrate.
create or replace function public.sync_order_item_modifiers_from_array()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    delete from public.order_item_modifiers
    where order_item_id = old.id
      and modifier_type = 'custom'
      and modifier_code is null;
    return old;
  end if;

  if tg_op = 'UPDATE'
     and new.modifiers is not distinct from old.modifiers then
    return new;
  end if;

  delete from public.order_item_modifiers
  where order_item_id = new.id
    and modifier_type = 'custom'
    and modifier_code is null;

  insert into public.order_item_modifiers (
    order_item_id,
    modifier_name,
    modifier_type,
    position
  )
  select
    new.id,
    m.modifier_name,
    'custom',
    m.position::smallint
  from unnest(coalesce(new.modifiers, '{}'::text[])) with ordinality as m(modifier_name, position);

  return new;
end;
$$;

create or replace function public.sync_order_item_modifier_array()
returns trigger
language plpgsql
as $$
declare
  v_order_item_id uuid;
  v_modifiers text[];
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  v_order_item_id := coalesce(new.order_item_id, old.order_item_id);

  select
    coalesce(array_agg(modifier_name order by position, id), '{}'::text[])
  into v_modifiers
  from public.order_item_modifiers
  where order_item_id = v_order_item_id;

  update public.order_items
  set modifiers = v_modifiers
  where id = v_order_item_id
    and modifiers is distinct from v_modifiers;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_kitchen_stations_set_updated_at on public.kitchen_stations;
create trigger trg_kitchen_stations_set_updated_at
before update on public.kitchen_stations
for each row execute function public.set_updated_at();

drop trigger if exists trg_staff_profiles_set_updated_at on public.staff_profiles;
create trigger trg_staff_profiles_set_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_prepare_insert on public.orders;
create trigger trg_orders_prepare_insert
before insert on public.orders
for each row execute function public.prepare_order_on_insert();

drop trigger if exists trg_orders_apply_business_rules on public.orders;
create trigger trg_orders_apply_business_rules
before update on public.orders
for each row execute function public.apply_order_business_rules();

drop trigger if exists trg_orders_log_events on public.orders;
create trigger trg_orders_log_events
after insert or update on public.orders
for each row execute function public.log_order_events();

drop trigger if exists trg_order_items_assign_line_number on public.order_items;
create trigger trg_order_items_assign_line_number
before insert on public.order_items
for each row execute function public.assign_order_item_line_number();

drop trigger if exists trg_order_items_set_updated_at on public.order_items;
create trigger trg_order_items_set_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_order_item_modifiers_set_updated_at on public.order_item_modifiers;
create trigger trg_order_item_modifiers_set_updated_at
before update on public.order_item_modifiers
for each row execute function public.set_updated_at();

drop trigger if exists trg_order_items_modifiers_to_rows on public.order_items;
create trigger trg_order_items_modifiers_to_rows
after insert or update of modifiers or delete on public.order_items
for each row execute function public.sync_order_item_modifiers_from_array();

drop trigger if exists trg_order_item_modifiers_rows_to_array on public.order_item_modifiers;
create trigger trg_order_item_modifiers_rows_to_array
after insert or update or delete on public.order_item_modifiers
for each row execute function public.sync_order_item_modifier_array();

drop trigger if exists trg_order_station_assignments_set_updated_at on public.order_station_assignments;
create trigger trg_order_station_assignments_set_updated_at
before update on public.order_station_assignments
for each row execute function public.set_updated_at();

drop trigger if exists trg_kitchen_sessions_set_updated_at on public.kitchen_sessions;
create trigger trg_kitchen_sessions_set_updated_at
before update on public.kitchen_sessions
for each row execute function public.set_updated_at();

drop trigger if exists trg_kds_client_heartbeats_set_updated_at on public.kds_client_heartbeats;
create trigger trg_kds_client_heartbeats_set_updated_at
before update on public.kds_client_heartbeats
for each row execute function public.set_updated_at();

drop trigger if exists trg_kds_incidents_set_updated_at on public.kds_incidents;
create trigger trg_kds_incidents_set_updated_at
before update on public.kds_incidents
for each row execute function public.set_updated_at();

drop trigger if exists trg_kds_anomalies_set_updated_at on public.kds_anomalies;
create trigger trg_kds_anomalies_set_updated_at
before update on public.kds_anomalies
for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- 8) RLS POLICIES
-------------------------------------------------------------------------------

alter table public.kitchen_stations enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.staff_station_memberships enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.order_station_assignments enable row level security;
alter table public.kitchen_sessions enable row level security;
alter table public.order_events enable row level security;
alter table public.kds_command_log enable row level security;
alter table public.kds_technical_events enable row level security;
alter table public.kds_client_heartbeats enable row level security;
alter table public.kds_incidents enable row level security;
alter table public.kds_anomalies enable row level security;
alter table public.kds_incident_timeline enable row level security;
alter table public.kds_recovery_actions enable row level security;

-- Remove legacy permissive policies (if present from old schema).
drop policy if exists "kds_read_orders" on public.orders;
drop policy if exists "kds_update_order_status" on public.orders;
drop policy if exists "kds_read_order_items" on public.order_items;

drop policy if exists "stations_select" on public.kitchen_stations;
create policy "stations_select"
  on public.kitchen_stations
  for select
  to authenticated
  using ((is_active = true and archived_at is null) or public.is_privileged_role());

drop policy if exists "stations_manage" on public.kitchen_stations;
create policy "stations_manage"
  on public.kitchen_stations
  for all
  to authenticated
  using (public.is_privileged_role())
  with check (public.is_privileged_role());

drop policy if exists "staff_profiles_select" on public.staff_profiles;
create policy "staff_profiles_select"
  on public.staff_profiles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_privileged_role());

drop policy if exists "staff_profiles_insert" on public.staff_profiles;
create policy "staff_profiles_insert"
  on public.staff_profiles
  for insert
  to authenticated
  with check (public.is_privileged_role());

drop policy if exists "staff_profiles_update" on public.staff_profiles;
create policy "staff_profiles_update"
  on public.staff_profiles
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_privileged_role())
  with check (user_id = auth.uid() or public.is_privileged_role());

drop policy if exists "staff_memberships_select" on public.staff_station_memberships;
create policy "staff_memberships_select"
  on public.staff_station_memberships
  for select
  to authenticated
  using (staff_user_id = auth.uid() or public.is_privileged_role());

drop policy if exists "staff_memberships_manage" on public.staff_station_memberships;
create policy "staff_memberships_manage"
  on public.staff_station_memberships
  for all
  to authenticated
  using (public.is_privileged_role())
  with check (public.is_privileged_role());

drop policy if exists "orders_select" on public.orders;
create policy "orders_select"
  on public.orders
  for select
  to authenticated
  using (archived_at is null and public.can_view_station(station_id));

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert"
  on public.orders
  for insert
  to authenticated
  with check (public.can_manage_station(station_id) or public.is_privileged_role());

drop policy if exists "orders_update" on public.orders;
create policy "orders_update"
  on public.orders
  for update
  to authenticated
  using (public.can_view_station(station_id))
  with check (public.can_update_station_status(station_id) or public.is_privileged_role());

drop policy if exists "orders_delete" on public.orders;
create policy "orders_delete"
  on public.orders
  for delete
  to authenticated
  using (public.is_privileged_role());

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.archived_at is null
        and public.can_view_station(o.station_id)
    )
  );

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert"
  on public.order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (public.can_update_station_status(o.station_id) or public.is_privileged_role())
    )
  );

drop policy if exists "order_items_update" on public.order_items;
create policy "order_items_update"
  on public.order_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and public.can_view_station(o.station_id)
    )
  )
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (public.can_update_station_status(o.station_id) or public.is_privileged_role())
    )
  );

drop policy if exists "order_item_modifiers_select" on public.order_item_modifiers;
create policy "order_item_modifiers_select"
  on public.order_item_modifiers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and o.archived_at is null
        and public.can_view_station(o.station_id)
    )
  );

drop policy if exists "order_item_modifiers_manage" on public.order_item_modifiers;
create policy "order_item_modifiers_manage"
  on public.order_item_modifiers
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and (public.can_update_station_status(o.station_id) or public.is_privileged_role())
    )
  )
  with check (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and (public.can_update_station_status(o.station_id) or public.is_privileged_role())
    )
  );

drop policy if exists "order_station_assignments_select" on public.order_station_assignments;
create policy "order_station_assignments_select"
  on public.order_station_assignments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_station_assignments.order_id
        and public.can_view_station(o.station_id)
    )
  );

drop policy if exists "order_station_assignments_manage" on public.order_station_assignments;
create policy "order_station_assignments_manage"
  on public.order_station_assignments
  for all
  to authenticated
  using (public.is_privileged_role())
  with check (public.is_privileged_role());

drop policy if exists "kitchen_sessions_select" on public.kitchen_sessions;
create policy "kitchen_sessions_select"
  on public.kitchen_sessions
  for select
  to authenticated
  using (staff_user_id = auth.uid() or public.is_privileged_role());

drop policy if exists "kitchen_sessions_insert" on public.kitchen_sessions;
create policy "kitchen_sessions_insert"
  on public.kitchen_sessions
  for insert
  to authenticated
  with check (staff_user_id is null or staff_user_id = auth.uid() or public.is_privileged_role());

drop policy if exists "kitchen_sessions_update" on public.kitchen_sessions;
create policy "kitchen_sessions_update"
  on public.kitchen_sessions
  for update
  to authenticated
  using (staff_user_id = auth.uid() or public.is_privileged_role())
  with check (staff_user_id = auth.uid() or public.is_privileged_role());

drop policy if exists "order_events_select" on public.order_events;
create policy "order_events_select"
  on public.order_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_events.order_id
        and public.can_view_station(o.station_id)
    )
  );

-- Audit log should be immutable from client side.
revoke insert, update, delete on public.order_events from anon, authenticated;

drop policy if exists "kds_command_log_select" on public.kds_command_log;
create policy "kds_command_log_select"
  on public.kds_command_log
  for select
  to authenticated
  using (
    public.is_privileged_role()
    or exists (
      select 1
      from public.orders o
      where o.id = kds_command_log.order_id
        and public.can_view_station(o.station_id)
    )
  );

drop policy if exists "kds_command_log_manage" on public.kds_command_log;
create policy "kds_command_log_manage"
  on public.kds_command_log
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_jwt_role() = 'service_role')
  with check (public.is_privileged_role() or public.current_jwt_role() = 'service_role');

drop policy if exists "kds_technical_events_select" on public.kds_technical_events;
create policy "kds_technical_events_select"
  on public.kds_technical_events
  for select
  to authenticated
  using (
    public.is_privileged_role()
    or (session_id is not null and exists (
      select 1
      from public.kitchen_sessions ks
      where ks.id = kds_technical_events.session_id
        and (ks.staff_user_id = auth.uid() or public.can_view_station(ks.station_id))
    ))
    or (order_id is not null and exists (
      select 1
      from public.orders o
      where o.id = kds_technical_events.order_id
        and public.can_view_station(o.station_id)
    ))
  );

drop policy if exists "kds_technical_events_manage" on public.kds_technical_events;
create policy "kds_technical_events_manage"
  on public.kds_technical_events
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_jwt_role() = 'service_role')
  with check (public.is_privileged_role() or public.current_jwt_role() = 'service_role');

drop policy if exists "kds_client_heartbeats_select" on public.kds_client_heartbeats;
create policy "kds_client_heartbeats_select"
  on public.kds_client_heartbeats
  for select
  to authenticated
  using (public.can_view_station(station_id) or public.is_privileged_role());

drop policy if exists "kds_client_heartbeats_manage" on public.kds_client_heartbeats;
create policy "kds_client_heartbeats_manage"
  on public.kds_client_heartbeats
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_jwt_role() = 'service_role')
  with check (public.is_privileged_role() or public.current_jwt_role() = 'service_role');

drop policy if exists "kds_incidents_select" on public.kds_incidents;
create policy "kds_incidents_select"
  on public.kds_incidents
  for select
  to authenticated
  using (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'));

drop policy if exists "kds_incidents_manage" on public.kds_incidents;
create policy "kds_incidents_manage"
  on public.kds_incidents
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'))
  with check (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'));

drop policy if exists "kds_anomalies_select" on public.kds_anomalies;
create policy "kds_anomalies_select"
  on public.kds_anomalies
  for select
  to authenticated
  using (
    public.is_privileged_role()
    or (station_id is not null and public.can_view_station(station_id))
    or (order_id is not null and exists (
      select 1
      from public.orders o
      where o.id = kds_anomalies.order_id
        and public.can_view_station(o.station_id)
    ))
  );

drop policy if exists "kds_anomalies_manage" on public.kds_anomalies;
create policy "kds_anomalies_manage"
  on public.kds_anomalies
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'))
  with check (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'));

drop policy if exists "kds_incident_timeline_select" on public.kds_incident_timeline;
create policy "kds_incident_timeline_select"
  on public.kds_incident_timeline
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.kds_incidents i
      where i.id = kds_incident_timeline.incident_id
        and (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'))
    )
  );

drop policy if exists "kds_incident_timeline_manage" on public.kds_incident_timeline;
create policy "kds_incident_timeline_manage"
  on public.kds_incident_timeline
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'))
  with check (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'));

drop policy if exists "kds_recovery_actions_select" on public.kds_recovery_actions;
create policy "kds_recovery_actions_select"
  on public.kds_recovery_actions
  for select
  to authenticated
  using (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'));

drop policy if exists "kds_recovery_actions_manage" on public.kds_recovery_actions;
create policy "kds_recovery_actions_manage"
  on public.kds_recovery_actions
  for all
  to authenticated
  using (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'))
  with check (public.is_privileged_role() or public.current_staff_role() in ('manager', 'admin'));

-- Keep observability/incident writes behind RPC/service and system triggers.
revoke insert, update, delete on public.kds_command_log from anon, authenticated;
revoke insert, update, delete on public.kds_technical_events from anon, authenticated;
revoke insert, update, delete on public.kds_client_heartbeats from anon, authenticated;
revoke insert, update, delete on public.kds_incidents from anon, authenticated;
revoke insert, update, delete on public.kds_anomalies from anon, authenticated;
revoke insert, update, delete on public.kds_incident_timeline from anon, authenticated;
revoke insert, update, delete on public.kds_recovery_actions from anon, authenticated;

-------------------------------------------------------------------------------
-- 9) REALTIME PUBLICATION (TABLES ONLY)
-------------------------------------------------------------------------------

alter table public.orders replica identity full;
alter table public.order_items replica identity full;
alter table public.order_item_modifiers replica identity full;
alter table public.order_events replica identity full;
alter table public.kitchen_stations replica identity full;
alter table public.kds_anomalies replica identity full;
alter table public.kds_incidents replica identity full;
alter table public.kds_client_heartbeats replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.order_items;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.order_item_modifiers;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.order_events;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.kitchen_stations;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.kds_anomalies;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.kds_incidents;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.kds_client_heartbeats;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

commit;
