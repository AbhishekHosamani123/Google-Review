# ReviewHub — Multi-shop NFC / QR Smart Google Review Platform

RevmeAI-inspired, Vercel + Supabase, no external backend, no LLM.

**Flow:** You (single admin) create shops → assign a pre-made QR from a pool of 10 (or generate more) → QR encodes `yourdomain.com/r/<8-char-code>` → customer scans NFC/QR → branded review helper (logo, stars, chips, tone, template draft, Copy & Open Google) — or direct 302 to Google if AI toggle is off. Changing a shop's Google review URL moves every linked QR instantly — no reprint.

## Stack
- Next.js 15 App Router · Tailwind 3 · qrcode + nanoid
- Supabase: Postgres + Auth + Storage (`shop-logos` bucket, public) + RLS
- Vercel standalone (Route Handlers + Server Actions + middleware)

## Quick start
```bash
npm install
cp .env.example .env   # fill Supabase keys + SITE_URL
npm run dev            # http://localhost:3000
npm run build && npm run start
```

## Supabase setup (once)
1. Create a free project at https://supabase.com.
2. **SQL editor → run** `supabase/schema.sql` (shops, qr_codes, analytics_events + RLS).
3. **SQL editor → run** `supabase/seed.sql` (10 unassigned QR codes for the pool).
4. **Storage → Create bucket** `shop-logos` (public). Enable image transforms if you want thumbnails.
5. **Authentication → Users → Add user** (email + password) — this is your single admin login.
6. Add env vars locally (`.env`) and in Vercel Project → Settings → Environment Variables.

## How to use (admin)
1. Login at `/login` → `/dashboard`.
2. **Shops → New shop**: name, slug, Google review URL (validated `https://` Google domain), Place ID optional, city/category, address, keywords override (comma separated), AI helper toggle (OFF = QR 302s directly to Google), logo PNG (≤2 MB, server upload to `shop-logos/<shopId>/...`, shown as circular logo on customer page).
3. **QR Pool**: see the 10 pre-made codes (like RevmeAI), assign any to a shop (dropdown), generate new, copy link, download 1024px PNG (H-correction, ` /api/qr/image?url=...`), deactivate.
4. Print the NFC card: NFC tag (NTAG213 URI `https://yourdomain.com/r/<code>`, lock read-only) + QR print image ≥2×2 cm, H-correction (logo overlay ≤22% with white padding if you add one).
5. Changing a shop's Google URL in the dashboard retargets every linked QR immediately — no reprint.

## Customer page (`/r/[code]`)
- Header: circular PNG logo (or initials), shop name, city/category, Review on Google badge.
- Hero: photo hero if no logo, or compact header with logo if present.
- Rating (default 5), 1–5 keyword chips (from shop.keywords or defaults), tone (Friendly/Professional/Elegant → uses `lib/reviews/templates.js`), Generate → editable draft → **Copy & Open Google Reviews** (clipboard + new tab to the shop's Google URL). Popup-blocked → HelpModal with selectable textarea. Scan + Copy events logged to `analytics_events` (service_role in route handler, anon blocked). Tagline: Draft — edit before posting. Genuine visits only.

## Deploy to Vercel
- Import this repo in Vercel, set the four env vars (anon + service role + site URL).
- Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain first, then to your custom domain after adding it in Vercel → Domains — QRs encode whatever SITE_URL was at generation/display time, so links remain valid after you switch (they are `/r/<code>` on whatever domain you use).

## File map
```
app/layout.jsx, app/globals.css, app/page.jsx        Landing
app/login/page.jsx                                   Admin login
app/dashboard/layout.jsx + nav, app/dashboard/page.jsx  Overview
app/dashboard/shops/*                                Shops CRUD
app/dashboard/qr/page.jsx + components/QrPoolClient.jsx  QR Pool
app/r/[code]/page.jsx + components/ReviewClient.jsx  Branded customer funnel
app/api/qr/image/route.js                            Server PNG (qrcode H)
app/api/auth/signout/route.js
components/StarRating, KeywordChips, ToneToggle, ReviewPreview, Toast, HelpModal
lib/reviews/keywords.js + templates.js               Template engine (no LLM)
lib/supabase/client, server, admin                   SSR + service_role
lib/qr.js, lib/config.js
middleware.js                                        Auth guard for /dashboard
supabase/schema.sql + seed.sql
```

## Notes
- No billing in MVP (you sell cards offline). Add Cashfree/Stripe later — same schema works, add an organizations layer then.
- No LLM — templates are combinatorial (banks × chips × tone) with shuffle + length variation; swap `generateReview()` to an LLM edge function later without touching UI.
- RLS: public select only on active shops/qrs for the funnel; analytics inserts only via service_role in route handler; logo uploads go through Server Action with type/size validation.
