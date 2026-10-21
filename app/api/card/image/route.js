import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { withQrNumbers, qrLinkUrl } from "@/lib/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, getDemoQrs } from "@/lib/demo";

// Renders the REAL printed card (New_card.png in the project root) with the
// numbered QR code composited into the "SCAN FOR REVIEW" area.
//   /api/card/image?qr=1&size=1254  -> full card, QR1 embedded
// The QR encodes the permanent link  <SITE_URL>/r/Radha<n>  — shop is resolved
// live at scan time, so cards can be re-targeted to any shop later.
const CARD_PATH = path.join(process.cwd(), "New_card.png");

// placement measured on the 1254x1254 card (QR frame with blue corner brackets,
// left column). The white cover sits strictly between the bracket arms:
//   top arm ends y=687, bottom arm starts y=1024, sample QR black = 149..450 x 711..1016
const CARD_W = 1254;
const COVER = { x: 128, y: 689, w: 341, h: 334 }; // white cover over the baked-in sample QR
const QR_CENTER = { x: 297, y: 856 }; // centered in the bracket frame (113..481 x 677..1036)

async function resolveQrUrl(ref, requestBase) {
  const n = parseInt(String(ref || ""), 10);
  if (isDemoMode()) {
    const qr = withQrNumbers(getDemoQrs()).find((q) => q.qrNum === n);
    return qr ? qrLinkUrl(qr, requestBase) : null;
  }
  const admin = createAdminClient();
  const { data: rows } = await admin.from("qr_codes").select("*").order("created_at", { ascending: true });
  const qr = withQrNumbers(rows || []).find((q) => q.qrNum === n);
  return qr ? qrLinkUrl(qr, requestBase) : null;
}

function requestBaseFrom(req) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = (req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")).split(",")[0];
  return host ? `${proto}://${host}` : "";
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("qr");
  const size = Math.min(2500, Math.max(400, parseInt(searchParams.get("size") || String(CARD_W), 10) || CARD_W));
  let link;
  try {
    link = await resolveQrUrl(ref, requestBaseFrom(req));
  } catch {
    return new Response("Card service unavailable", { status: 503 });
  }
  if (!link) return new Response("Unknown QR number", { status: 404 });
  try {
    // clean, minimal QR: short permanent URL, ECC level M (fewer modules than
    // H), integer pixel-per-module scaling, pure black on TRANSPARENT background
    // (the white cover supplies the white background + generous quiet zone).
    const { errorCorrectionLevel: ECC } = { errorCorrectionLevel: "M" };
    const modulesCount = QRCode.create(link, { errorCorrectionLevel: ECC }).modules.size;
    const usable = Math.min(COVER.w, COVER.h) - 44; // quiet zone ≈22px on each side
    const ppum = Math.max(6, Math.floor(usable / modulesCount)); // integer px per module
    const side = ppum * modulesCount;
    const qrPng = await QRCode.toBuffer(link, {
      errorCorrectionLevel: ECC,
      scale: ppum,
      margin: 0,
      color: { dark: "#000000ff", light: "#00000000" },
    });
    const whitePatch = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${COVER.w}" height="${COVER.h}"><rect width="100%" height="100%" fill="#ffffff"/></svg>`);
    const qrSquare = await sharp(qrPng).png().toBuffer();
    const left = QR_CENTER.x - Math.round(side / 2);
    const top = QR_CENTER.y - Math.round(side / 2);
    let card = await sharp(CARD_PATH)
      .composite([
        { input: whitePatch, left: COVER.x, top: COVER.y },
        { input: qrSquare, left, top },
      ])
      .png()
      .toBuffer();
    if (size !== CARD_W) card = await sharp(card).resize(size, Math.round((size * CARD_W) / CARD_W)).png().toBuffer();
    return new Response(card, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
