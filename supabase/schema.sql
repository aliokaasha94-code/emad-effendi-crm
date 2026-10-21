begin;

create extension if not exists "uuid-ossp";

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'create role anon nologin noinherit';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'create role authenticated nologin noinherit';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'create role service_role nologin noinherit';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'customer_segment' and n.nspname = 'public'
  ) then
    execute $ddl$create type public.customer_segment as enum ('VIP_CHAMPION', 'LOYAL_REGULAR', 'PROMISING_NEW', 'SLIPPING_AWAY', 'CHURNED_LOST', 'CUSTOM')$ddl$;
  end if;
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'order_source' and n.nspname = 'public'
  ) then
    execute $ddl$create type public.order_source as enum ('CASHIER_MANUAL', 'FOODICS_IMPORT', 'WEB_MENU', 'QR_LOYALTY')$ddl$;
  end if;
end;
$$;

create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone_number text not null unique,
  email text,
  date_of_birth date,
  favorite_drink text,
  preferred_seating text,
  custom_notes text,
  total_spent numeric(12,2) not null default 0.00,
  orders_count integer not null default 0,
  loyalty_points integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  segment public.customer_segment not null default 'PROMISING_NEW',
  rfm_score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  receipt_number text,
  amount numeric(10,2) not null check (amount >= 0),
  source public.order_source not null default 'CASHIER_MANUAL',
  items_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  target_segment public.customer_segment not null,
  message_template text not null,
  discount_code text,
  recipients_count integer not null default 0,
  converted_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on public.customers(phone_number);
create index if not exists idx_customers_segment on public.customers(segment);
create index if not exists idx_customers_last_seen on public.customers(last_seen_at desc nulls last);
create index if not exists idx_transactions_customer on public.transactions(customer_id);
create index if not exists idx_transactions_date on public.transactions(created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customers_touch_updated_at on public.customers;
create trigger trg_customers_touch_updated_at
before update on public.customers
for each row
execute function public.touch_updated_at();

create or replace function public.recalculate_customer_stats(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_spent numeric(12,2);
  v_orders_count integer;
  v_first_seen timestamptz;
  v_last_seen timestamptz;
  v_segment public.customer_segment;
begin
  select
    coalesce(sum(t.amount), 0)::numeric(12,2),
    count(t.id)::integer,
    min(t.created_at),
    max(t.created_at)
  into v_total_spent, v_orders_count, v_first_seen, v_last_seen
  from public.transactions t
  where t.customer_id = p_customer_id;

  if v_orders_count = 0 then
    update public.customers c
    set
      total_spent = 0.00,
      orders_count = 0,
      loyalty_points = 0,
      first_seen_at = coalesce(v_first_seen, c.first_seen_at),
      last_seen_at = null,
      segment = case
        when c.segment = 'CUSTOM'::public.customer_segment then 'CUSTOM'::public.customer_segment
        else 'PROMISING_NEW'::public.customer_segment
      end
    where c.id = p_customer_id;

    if not found then
      return;
    end if;
    return;
  end if;

  select case
    when v_orders_count >= 6
      and extract(epoch from (now() - v_last_seen)) / 86400.0 <= 10
      then 'VIP_CHAMPION'::public.customer_segment
    when v_orders_count >= 3
      and extract(epoch from (now() - v_last_seen)) / 86400.0 <= 14
      then 'LOYAL_REGULAR'::public.customer_segment
    when extract(epoch from (now() - v_last_seen)) / 86400.0 > 30
      then 'CHURNED_LOST'::public.customer_segment
    when extract(epoch from (now() - v_last_seen)) / 86400.0 > 14
      then 'SLIPPING_AWAY'::public.customer_segment
    else 'PROMISING_NEW'::public.customer_segment
  end
  into v_segment;

  update public.customers c
  set
    total_spent = v_total_spent,
    orders_count = v_orders_count,
    loyalty_points = floor(v_total_spent / 10)::integer,
    first_seen_at = coalesce(v_first_seen, c.first_seen_at),
    last_seen_at = v_last_seen,
    segment = case
      when c.segment = 'CUSTOM'::public.customer_segment then 'CUSTOM'::public.customer_segment
      else v_segment
    end
  where c.id = p_customer_id;

  if not found then
    return;
  end if;
end;
$$;

create or replace function public.handle_transaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_customer_stats(old.customer_id);
    return old;
  end if;

  perform public.recalculate_customer_stats(new.customer_id);

  if tg_op = 'UPDATE' and new.customer_id is distinct from old.customer_id then
    perform public.recalculate_customer_stats(old.customer_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_after_transaction_insert on public.transactions;
drop trigger if exists trg_transactions_recalculate on public.transactions;
create trigger trg_transactions_recalculate
after insert or update or delete on public.transactions
for each row
execute function public.handle_transaction_change();

create or replace function public.dashboard_overview()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
with segment_counts as (
  select
    s.value as segment,
    count(c.id)::integer as customer_count,
    s.ordinality
  from unnest(enum_range(null::public.customer_segment)) with ordinality as s(value, ordinality)
  left join public.customers c on c.segment = s.value
  group by s.value, s.ordinality
),
daily as (
  select
    to_char(d.day, 'YYYY-MM-DD') as day_key,
    coalesce(sum(t.amount), 0)::numeric(12,2) as revenue,
    count(t.id)::integer as order_count
  from generate_series(
    (current_date - 13)::timestamp,
    current_date::timestamp,
    interval '1 day'
  ) as d(day)
  left join public.transactions t on t.created_at::date = d.day::date
  group by d.day
  order by d.day
),
top_customers as (
  select
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', full_name,
        'phone', phone_number,
        'total_spent', total_spent,
        'orders_count', orders_count,
        'segment', segment
      )
      order by total_spent desc, full_name asc
    ) as items
  from (
    select id, full_name, phone_number, total_spent, orders_count, segment
    from public.customers
    order by total_spent desc, full_name asc
    limit 5
  ) ranked
),
recent_transactions as (
  select
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'amount', amount,
        'created_at', created_at,
        'source', source,
        'customer_name', customer_name,
        'customer_phone', customer_phone
      )
      order by created_at desc
    ) as items
  from (
    select
      t.id,
      t.amount,
      t.created_at,
      t.source,
      c.full_name as customer_name,
      c.phone_number as customer_phone
    from public.transactions t
    join public.customers c on c.id = t.customer_id
    order by t.created_at desc
    limit 8
  ) latest
)
select jsonb_build_object(
  'total_customers', (select count(*)::integer from public.customers),
  'active_customers', (
    select count(*)::integer
    from public.customers
    where segment in ('VIP_CHAMPION'::public.customer_segment, 'LOYAL_REGULAR'::public.customer_segment)
  ),
  'at_risk', (
    select count(*)::integer
    from public.customers
    where segment in ('SLIPPING_AWAY'::public.customer_segment, 'CHURNED_LOST'::public.customer_segment)
  ),
  'total_points', (select coalesce(sum(loyalty_points), 0)::integer from public.customers),
  'month_revenue', (
    select coalesce(sum(amount), 0)::numeric(12,2)
    from public.transactions
    where created_at >= date_trunc('month', now())
  ),
  'month_transactions', (
    select count(*)::integer
    from public.transactions
    where created_at >= date_trunc('month', now())
  ),
  'segments', coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('segment', segment, 'count', customer_count)
        order by ordinality
      )
      from segment_counts
    ),
    '[]'::jsonb
  ),
  'daily_revenue', coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('date', day_key, 'revenue', revenue, 'orders', order_count)
        order by day_key
      )
      from daily
    ),
    '[]'::jsonb
  ),
  'top_customers', coalesce((select items from top_customers), '[]'::jsonb),
  'recent_transactions', coalesce((select items from recent_transactions), '[]'::jsonb)
);
$$;

alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.marketing_campaigns enable row level security;

drop policy if exists customers_authenticated_all on public.customers;
create policy customers_authenticated_all
on public.customers
for all
to authenticated
using (true)
with check (true);

drop policy if exists transactions_authenticated_all on public.transactions;
create policy transactions_authenticated_all
on public.transactions
for all
to authenticated
using (true)
with check (true);

drop policy if exists marketing_campaigns_authenticated_all on public.marketing_campaigns;
create policy marketing_campaigns_authenticated_all
on public.marketing_campaigns
for all
to authenticated
using (true)
with check (true);

revoke all on table public.customers from anon;
revoke all on table public.transactions from anon;
revoke all on table public.marketing_campaigns from anon;

grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.marketing_campaigns to authenticated;

grant all on table public.customers to service_role;
grant all on table public.transactions to service_role;
grant all on table public.marketing_campaigns to service_role;

grant usage on schema public to anon, authenticated, service_role;

revoke execute on function public.dashboard_overview() from public, anon;
revoke execute on function public.recalculate_customer_stats(uuid) from public, anon;
revoke execute on function public.touch_updated_at() from public, anon;
revoke execute on function public.handle_transaction_change() from public, anon;

grant execute on function public.dashboard_overview() to authenticated, service_role;
grant execute on function public.recalculate_customer_stats(uuid) to authenticated, service_role;
grant execute on function public.touch_updated_at() to authenticated, service_role;
grant execute on function public.handle_transaction_change() to authenticated, service_role;

commit;
