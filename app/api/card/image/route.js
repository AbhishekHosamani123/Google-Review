import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { withQrNumbers, qrLinkUrl } from "@/lib/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, getDemoQrs } from "@/lib/demo";

// Renders the REAL printed card (new-card.png: blue "We would appreciate your
// Google review!" design) with the card's genuine QR code composited over the
// sample QR, and the card's own short code printed under it (replaces KEJF9).
//   /api/card/image?qr=1&size=1254  -> full card, QR1 embedded
// The QR encodes the permanent link  <SITE_URL>/r/QR<n>  — shop is resolved
// live at scan time, so cards can be re-targeted to any shop later.
const CARD_PATH = path.join(process.cwd(), "new-card.png");

const CARD_W = 1254;
// zones measured on the 1254x1254 template (right half, "OR SCAN QR" column)
const PATCH = { x: 812, y: 815, w: 302, h: 306 }; // white cover over the sample QR
const QR_SIDE = 282; // our QR inside the patch (centred)
const TEXT_PATCH = { x: 858, y: 1126, w: 210, h: 52 }; // white cover over the sample code text
const TEXT_SIZE = 42; // code text cap height matches the sample "KEJF9"

async function resolveQr(ref) {
  const n = parseInt(String(ref || ""), 10);
  if (isDemoMode()) {
    const qr = withQrNumbers(getDemoQrs()).find((q) => q.qrNum === n);
    return qr ? { link: qrLinkUrl(qr), code: qr.code } : null;
  }
  const admin = createAdminClient();
  const { data: rows } = await admin.from("qr_codes").select("*").order("created_at", { ascending: true });
  const qr = withQrNumbers(rows || []).find((q) => q.qrNum === n);
  return qr ? { link: qrLinkUrl(qr), code: qr.code } : null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("qr");
  const size = Math.min(2500, Math.max(400, parseInt(searchParams.get("size") || String(CARD_W), 10) || CARD_W));
  let info;
  try {
    info = await resolveQr(ref);
  } catch {
    return new Response("Card service unavailable", { status: 503 });
  }
  if (!info) return new Response("Unknown QR number", { status: 404 });
  const { link, code } = info;
  try {
    const qrPng = await QRCode.toBuffer(link, {
      width: 900,
      errorCorrectionLevel: "H",
      margin: 2,
      color: { dark: "#000000ff", light: "#ffffffff" },
    });
    const whitePatch = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PATCH.w}" height="${PATCH.h}"><rect width="100%" height="100%" fill="#ffffff"/></svg>`);
    const textPatch = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TEXT_PATCH.w}" height="${TEXT_PATCH.h}"><rect width="100%" height="100%" fill="#ffffff"/></svg>`);
    // the card's own short code, typeset like the sample "KEJF9"
    const safe = String(code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
    const codeSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TEXT_PATCH.w}" height="${TEXT_PATCH.h}">` +
        `<text x="${TEXT_PATCH.w / 2}" y="37" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="${TEXT_SIZE}" font-weight="600" letter-spacing="2.5" fill="#202124" text-anchor="middle">${safe}</text>` +
      `</svg>`
    );
    const qrSquare = await sharp(qrPng).resize(QR_SIDE, QR_SIDE, { fit: "fill" }).png().toBuffer();
    let card = await sharp(CARD_PATH)
      .composite([
        { input: whitePatch, left: PATCH.x, top: PATCH.y },
        { input: qrSquare, left: PATCH.x + Math.round((PATCH.w - QR_SIDE) / 2), top: PATCH.y + Math.round((PATCH.h - QR_SIDE) / 2) },
        { input: textPatch, left: TEXT_PATCH.x, top: TEXT_PATCH.y },
        { input: codeSvg, left: TEXT_PATCH.x, top: TEXT_PATCH.y },
      ])
      .png()
      .toBuffer();
    if (size !== CARD_W) card = await sharp(card).resize(size, size).png().toBuffer();
    return new Response(card, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=600" } });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
