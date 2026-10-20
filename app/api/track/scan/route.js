import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";

// Counts one visit per unique user: the browser decides if this user already
// scanned this shop (localStorage) and only calls this route on first visit.
// No user-identifying data is stored in the DB — only the counters.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req) {
  try {
    const body = await req.json();
    const { qr_code_id, shop_id } = body || {};
    const event_type = body?.event_type === "copy_open_google" ? "copy_open_google" : "scan";
    if (!UUID.test(String(qr_code_id || ""))) return Response.json({ ok: false, error: "bad qr_code_id" }, { status: 400 });
    if (shop_id && !UUID.test(String(shop_id))) return Response.json({ ok: false, error: "bad shop_id" }, { status: 400 });
    if (isDemoMode()) return Response.json({ ok: true, demo: true });
    const admin = createAdminClient();
    if (event_type === "scan") {
      const { data: cur, error: e1 } = await admin.from("qr_codes").select("scans_count").eq("id", qr_code_id).single();
      if (e1) throw e1;
      const { error: e2 } = await admin.from("qr_codes").update({ scans_count: (cur?.scans_count || 0) + 1 }).eq("id", qr_code_id);
      if (e2) throw e2;
    }
    const { error: e3 } = await admin.from("analytics_events").insert({
      qr_code_id,
      shop_id: shop_id || null,
      event_type,
    });
    if (e3) throw e3;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
