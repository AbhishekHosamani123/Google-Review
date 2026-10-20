const DEMO_SHOPS = [
  {
    id: "demo-shop-1",
    slug: "pink-verranda",
    name: "Pink Verranda",
    description: "Hotel & Restaurant — Belagavi",
    google_review_url: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    google_place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    logo_url: "",
    address: "Near Bus Stand, Belagavi",
    city: "Belagavi",
    category: "Hotel",
    ai_enabled: true,
    keywords: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-shop-2",
    slug: "spice-street",
    name: "Spice Street Kitchen",
    description: "Casual dining — family restaurant",
    google_review_url: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    google_place_id: "",
    logo_url: "",
    address: "MG Road, Belagavi",
    city: "Belagavi",
    category: "Restaurant",
    ai_enabled: true,
    keywords: ["Tasty Food", "Quick Service", "Family Friendly"],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const DEMO_QRS = [
  { id: "qr-1", code: "a1b2c3d4", shop_id: "demo-shop-1", label: "Counter NFC", type: "nfc", scans_count: 42, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-2", code: "e5f6g7h8", shop_id: "demo-shop-1", label: "Table QR", type: "qr", scans_count: 18, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-3", code: "i9j0k1l2", shop_id: null, label: "Pool QR 3", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-4", code: "m3n4o5p6", shop_id: null, label: "Pool QR 4", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-5", code: "q7r8s9t0", shop_id: null, label: "Pool QR 5", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-6", code: "u1v2w3x4", shop_id: null, label: "Pool QR 6", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-7", code: "y5z6a7b8", shop_id: null, label: "Pool QR 7", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-8", code: "c9d0e1f2", shop_id: null, label: "Pool QR 8", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-9", code: "g3h4i5j6", shop_id: "demo-shop-2", label: "Counter", type: "qr", scans_count: 7, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-10", code: "k7l8m9n0", shop_id: null, label: "Pool QR 10", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
  { id: "qr-demo", code: "demo-pink", shop_id: "demo-shop-1", label: "Demo — Pink Verranda", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() },
];

export function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return !url || url.includes("example") || url.includes("your-project") || url.trim() === "";
}

export function getDemoShops() { return DEMO_SHOPS; }
export function getDemoQrs() { return DEMO_QRS; }
export function getDemoShopById(id) { return DEMO_SHOPS.find(s=>s.id===id) || null; }
export function getDemoQrByCode(code) { return DEMO_QRS.find(q=>q.code===code) || null; }

