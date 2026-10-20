-- RevmeAI-style multi-shop schema — run in Supabase SQL editor
-- Single admin: authenticated users are admins. Public reads active shops/qrs for /r/[code].

-- shops
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  google_review_url text not null,
  google_place_id text,
  logo_url text,
  address text,
  city text,
  category text,
  ai_enabled boolean not null default true,
  keywords jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists shops_slug_idx on public.shops (slug);
create index if not exists shops_active_idx on public.shops (is_active);

-- qr_codes — each code is what is encoded in NFC/QR: yourdomain.com/r/<code>
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  shop_id uuid references public.shops(id) on delete set null,
  label text,
  type text not null default 'qr' check (type in ('qr','nfc')),
  scans_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists qr_codes_code_idx on public.qr_codes (code);
create index if not exists qr_codes_shop_idx on public.qr_codes (shop_id);

-- review analytics
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  event_type text not null check (event_type in ('scan','copy_open_google')),
  ip_hash text,
  user_agent text,
  country text,
  city text,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_shop_time_idx on public.analytics_events (shop_id, created_at desc);
create index if not exists analytics_qr_time_idx on public.analytics_events (qr_code_id, created_at desc);
create index if not exists analytics_type_idx on public.analytics_events (event_type);

-- Enable RLS
alter table public.shops enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;

-- Public can view active shops/qrs for redirect/branded page (unauthenticated /r/[code])
drop policy if exists "Public can view active shops" on public.shops;
create policy "Public can view active shops" on public.shops for select using (is_active = true);

drop policy if exists "Authenticated can manage shops" on public.shops;
create policy "Authenticated can manage shops" on public.shops for all
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

drop policy if exists "Public can view active qr codes" on public.qr_codes;
create policy "Public can view active qr codes" on public.qr_codes for select using (is_active = true);

drop policy if exists "Authenticated can manage qr codes" on public.qr_codes;
create policy "Authenticated can manage qr codes" on public.qr_codes for all
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

-- Analytics: no public read; inserts only via service_role route handler
drop policy if exists "Authenticated can view analytics" on public.analytics_events;
create policy "Authenticated can view analytics" on public.analytics_events for select
  using ((select auth.uid()) is not null);

-- Shop logos bucket (create via dashboard or SQL: storage bucket)
-- Create bucket shop-logos as public via Supabase Dashboard > Storage
-- Then public read is automatic for public buckets. Server actions use service_role.
