import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { withQrNumbers, qrLinkUrl } from "@/lib/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, getDemoQrs } from "@/lib/demo";

// Renders the REAL printed card (new-card.png in the project root) with the
// numbered QR code composited into the "SCAN FOR REVIEW" area.
//   /api/card/image?qr=1&size=1254  -> full card, QR1 embedded
// The QR encodes the permanent link  <SITE_URL>/r/QR<n>  — shop is resolved
// live at scan time, so cards can be re-targeted to any shop later.
const CARD_PATH = path.join(process.cwd(), "new-card.png");

// placement measured on the 1254x1254 card (bottom-left QR frame)
const CARD_W = 1254;
const PATCH = { x: 110, y: 675, w: 382, h: 355 }; // white cover over the sample QR (inside the white frame)
const QR_SIDE = 300; // new QR square inside the patch

async function resolveQrUrl(ref) {
  const n = parseInt(String(ref || ""), 10);
  if (isDemoMode()) {
    const qr = withQrNumbers(getDemoQrs()).find((q) => q.qrNum === n);
    return qr ? qrLinkUrl(qr) : null;
  }
  const admin = createAdminClient();
  const { data: rows } = await admin.from("qr_codes").select("*").order("created_at", { ascending: true });
  const qr = withQrNumbers(rows || []).find((q) => q.qrNum === n);
  return qr ? qrLinkUrl(qr) : null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("qr");
  const size = Math.min(2500, Math.max(400, parseInt(searchParams.get("size") || String(CARD_W), 10) || CARD_W));
  let link;
  try {
    link = await resolveQrUrl(ref);
  } catch {
    return new Response("Card service unavailable", { status: 503 });
  }
  if (!link) return new Response("Unknown QR number", { status: 404 });
  try {
    const qrPng = await QRCode.toBuffer(link, { width: 900, errorCorrectionLevel: "H", margin: 2, color: { dark: "#000000ff", light: "#ffffffff" } });
    const whitePatch = Buffer.from(`<svg width="${PATCH.w}" height="${PATCH.h}"><rect width="100%" height="100%" fill="#ffffff"/></svg>`);
    const qrSquare = await sharp(qrPng).resize(QR_SIDE, QR_SIDE, { fit: "fill" }).png().toBuffer();
    let card = await sharp(CARD_PATH)
      .composite([
        { input: whitePatch, left: PATCH.x, top: PATCH.y },
        { input: qrSquare, left: PATCH.x + Math.round((PATCH.w - QR_SIDE) / 2), top: PATCH.y + Math.round((PATCH.h - QR_SIDE) / 2) },
      ])
      .png()
      .toBuffer();
    if (size !== CARD_W) card = await sharp(card).resize(size, Math.round((size * CARD_W) / CARD_W)).png().toBuffer();
    return new Response(card, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
