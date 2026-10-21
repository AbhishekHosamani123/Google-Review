import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { readFileSync } from "fs";
import * as opentypeModule from "opentype.js";
// CJS/ESM interop: pick whichever export carries the real API
const opentype = opentypeModule.parse ? opentypeModule : opentypeModule.default || opentypeModule;
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
const TEXT_SIZE = 42; // cap height matches the sample "KEJF9"
const TEXT_BASELINE = 37; // baseline inside the text patch

// the card's short code is typeset with a BUNDLED font converted to vector
// paths — serverless containers have no usable system fonts (SVG <text> renders
// as tofu boxes on Vercel), so no font resolution happens at runtime.
let fontCache = null;
function loadFont() {
  if (fontCache) return fontCache;
  // Roboto Medium 500 (latin WOFF) first — matches the card's sample weight
  for (const name of ["roboto-500.woff", "roboto-var.ttf"]) {
    try {
      const buf = readFileSync(path.join(process.cwd(), "fonts", name));
      fontCache = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      return fontCache;
    } catch {
      console.error("font load failed for", name);
    }
  }
  throw new Error("no embedded font");
}

function codeGlyphsSvg(text) {
  if (!text) return null;
  try {
    const font = loadFont();
    const spacing = 2.5;
    const scale = TEXT_SIZE / font.unitsPerEm;
    let width = 0;
    for (const ch of text) width += (font.charToGlyph(ch).advanceWidth || 0) * scale + spacing;
    width -= spacing;
    let x = (TEXT_PATCH.w - width) / 2;
    let d = "";
    for (const ch of text) {
      const glyph = font.charToGlyph(ch);
      d += glyph.getPath(x, TEXT_BASELINE, TEXT_SIZE).toPathData(2) + " ";
      x += (glyph.advanceWidth || 0) * scale + spacing;
    }
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TEXT_PATCH.w}" height="${TEXT_PATCH.h}">` +
        `<path d="${d}" fill="#202124"/>` +
      `</svg>`
    );
  } catch (e) {
    console.error("code text render failed:", String(e?.message || e));
    return null; // worst case: omit the code line rather than print garbage
  }
}

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
    // the card's own short code, vectorised (bundled font -> paths)
    const safe = String(code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
    const codeSvg = codeGlyphsSvg(safe);
    const qrSquare = await sharp(qrPng).resize(QR_SIDE, QR_SIDE, { fit: "fill" }).png().toBuffer();
    const layers = [
      { input: whitePatch, left: PATCH.x, top: PATCH.y },
      { input: qrSquare, left: PATCH.x + Math.round((PATCH.w - QR_SIDE) / 2), top: PATCH.y + Math.round((PATCH.h - QR_SIDE) / 2) },
      { input: textPatch, left: TEXT_PATCH.x, top: TEXT_PATCH.y },
    ];
    if (codeSvg) layers.push({ input: codeSvg, left: TEXT_PATCH.x, top: TEXT_PATCH.y });
    let card = await sharp(CARD_PATH).composite(layers).png().toBuffer();
    if (size !== CARD_W) card = await sharp(card).resize(size, size).png().toBuffer();
    return new Response(card, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=600" } });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
