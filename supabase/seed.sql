-- Seed 10 unassigned QR codes (assign to a shop later from dashboard)
-- Replace NEXT_PUBLIC_SITE_URL after deploy: codes stay the same, only base URL changes
insert into public.qr_codes (code, label, type) values
  ('a1b2c3d4', 'Pool QR 1', 'qr'),
  ('e5f6g7h8', 'Pool QR 2', 'qr'),
  ('i9j0k1l2', 'Pool QR 3', 'qr'),
  ('m3n4o5p6', 'Pool QR 4', 'qr'),
  ('q7r8s9t0', 'Pool QR 5', 'qr'),
  ('u1v2w3x4', 'Pool QR 6', 'qr'),
  ('y5z6a7b8', 'Pool QR 7', 'qr'),
  ('c9d0e1f2', 'Pool QR 8', 'qr'),
  ('g3h4i5j6', 'Pool QR 9', 'qr'),
  ('k7l8m9n0', 'Pool QR 10', 'qr')
on conflict (code) do nothing;
