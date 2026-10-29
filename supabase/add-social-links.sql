-- Add optional social links to shops (run in Supabase → SQL editor)
-- Stores the business's public Instagram profile URL and WhatsApp phone as
-- plain international digits (E.164, e.g. 919876543210 — wa.me/<digits>).
alter table public.shops add column if not exists instagram_url text;
alter table public.shops add column if not exists whatsapp_phone text;

-- RLS already covers whole-table access for public reads (active shops) and
-- authenticated admin writes, so no new policies are needed for these columns.
