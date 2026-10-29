import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { withQrNumbers, qrLinkUrl } from "@/lib/qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, getDemoQrs } from "@/lib/demo";

// Renders the REAL printed card (assets/New_Google_Review_Card.png — the
// portrait "Review us on Google / TAP | SCAN" design) with each business's
// dynamically generated QR code composited into the QR area.
//   /api/card/image?qr=1&size=3087  -> full card, QR1 embedded
// The QR encodes the permanent link  <SITE_URL>/r/Radha<n>  — shop is resolved
// live at scan time, so cards can be re-targeted to any shop later.
const CARD_FILENAME = "New_Google_Review_Card.png";
const CARD_PATH = path.join(process.cwd(), "assets", CARD_FILENAME);

// placement measured on the 3087x4584 template. The design ships with a baked
// in PLACEHOLDER QR: regenerate it per QR number — cover ONLY the placeholder's
// black modules (plus anti-alias fringe) with a background patch rebuilt from
// the pixels just outside the cover, then composite the real QR on top. The
// patch is invisible (no photo-frame edge) and everything else in the artwork
// is preserved untouched.
const CARD_W = 3087;
const CARD_H = 4584;
const SAMPLE = { x: 871, y: 2208, w: 1331, h: 1265 }; // baked-in placeholder QR (black modules)
const FEATHER = 6;
const COVER = { x: SAMPLE.x - FEATHER, y: SAMPLE.y - FEATHER, w: SAMPLE.w + 2 * FEATHER, h: SAMPLE.h + 2 * FEATHER }; // only pixels replaced
const QR_CENTER = { x: 1536, y: 2840 }; // centre of the placeholder QR

// Clearances from the QR centre to the nearest design elements, measured on
// the template (they set the largest QR + quiet zone we can fit):
//  - left dashed accents end at x=751, right dashed accents start at x=2313
//  - the five stars end at y=2103
//  - the blue bottom wave grazes the QR's lower-left corner; its outline rises
//    linearly: y ≈ 3496 + 0.31*(x-880). For a centred square of half-side s the
//    corner sits at (1536-s, 2840+s); require 4 quiet modules above it:
//      3496 + 0.31*(656-s) - 2840 - s >= 4ppm  <=>  (859-4ppm)/1.3117 >= s
const CLEAR_LEFT = QR_CENTER.x - 751; // 785
const CLEAR_RIGHT = 2313 - QR_CENTER.x; // 777
const CLEAR_TOP = QR_CENTER.y - 2103; // 737
function halfSideLimit(ppm) {
  const q = 4 * ppm;
  return Math.min(CLEAR_LEFT - q, CLEAR_RIGHT - q, CLEAR_TOP - q, (859 - q) / 1.3117);
}
// Largest integer pixel-per-module that fits half-side = ppm*n/2 in the clear area
function pickPixelPerModule(n) {
  for (let k = 48; k >= 20; k--) if ((k * n) / 2 <= halfSideLimit(k)) return k;
  return 24; // last resort — cramped but still scannable
}

// Reconstructed background patch — depends only on the template, so it is
// computed once per server instance and cached.
let patchPromise = null;
function getBackgroundPatch() {
  if (!patchPromise) {
    patchPromise = (async () => {
      const base = await sharp(CARD_PATH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const w = base.info.width, ch = base.info.channels;
      const px = (x, y) => { const i = (y * w + x) * ch; return [base.data[i], base.data[i + 1], base.data[i + 2]]; };
      const cw = COVER.w, chh = COVER.h;
      const SX = COVER.x - 4, EX = COVER.x + cw + 3, SY = COVER.y - 4, EY = COVER.y + chh + 3;
      const cL = [], cR = [], cT = [], cB = [];
      for (let yy = 0; yy < chh; yy++) { cL.push(px(SX, COVER.y + yy)); cR.push(px(EX, COVER.y + yy)); }
      for (let xx = 0; xx < cw; xx++) { cT.push(px(COVER.x + xx, SY)); cB.push(px(COVER.x + xx, EY)); }
      // inverse-distance-squared blend of the four directional samples: matches
      // the zone's soft gradient (brighter towards the middle, softer at corners)
      const patch = Buffer.alloc(cw * chh * 3);
      for (let yy = 0; yy < chh; yy++) {
        const dT = yy + 5, dB = chh - yy + 4;
        for (let xx = 0; xx < cw; xx++) {
          const dst = [xx + 5, cw - xx + 4, dT, dB];
          const s = [cL[yy], cR[yy], cT[xx], cB[xx]];
          const o = (yy * cw + xx) * 3;
          for (let c = 0; c < 3; c++) {
            let sw = 0, sv = 0;
            for (let k = 0; k < 4; k++) { const wt = 1 / (dst[k] * dst[k]); sv += wt * s[k][c]; sw += wt; }
            patch[o + c] = Math.round(sv / sw);
          }
        }
      }
      return sharp(patch, { raw: { width: cw, height: chh, channels: 3 } }).png().toBuffer();
    })().catch((e) => { patchPromise = null; throw e; });
  }
  return patchPromise;
}

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
  const size = Math.min(CARD_W, Math.max(400, parseInt(searchParams.get("size") || String(CARD_W), 10) || CARD_W));
  let link;
  try {
    link = await resolveQrUrl(ref, requestBaseFrom(req));
  } catch {
    return new Response("Card service unavailable", { status: 503 });
  }
  if (!link) return new Response("Unknown QR number", { status: 404 });
  try {
    // clean, minimal QR: short permanent URL, ECC level L (fewest modules for
    // this URL — the library picks the smallest valid version), integer
    // pixel-per-module scaling, pure black modules on a TRANSPARENT background
    // (the rebuilt card surface supplies the light background + a >=4-module
    // quiet zone to the nearest design elements, so the code blends into the
    // card with no visible image boundary).
    const ECC = "L";
    const modulesCount = QRCode.create(link, { errorCorrectionLevel: ECC }).modules.size;
    const ppum = pickPixelPerModule(modulesCount);
    const qrPng = await QRCode.toBuffer(link, {
      errorCorrectionLevel: ECC,
      scale: ppum,
      margin: 0,
      color: { dark: "#000000ff", light: "#00000000" },
    });
    const side = ppum * modulesCount;
    const patchPng = await getBackgroundPatch();
    const left = QR_CENTER.x - Math.round(side / 2);
    const top = QR_CENTER.y - Math.round(side / 2);
    let card = await sharp(CARD_PATH)
      .composite([
        { input: patchPng, left: COVER.x, top: COVER.y },
        { input: qrPng, left, top },
      ])
      .png()
      .toBuffer();
    if (size !== CARD_W) card = await sharp(card).resize(size, Math.round((size * CARD_H) / CARD_W)).png().toBuffer();
    return new Response(card, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
