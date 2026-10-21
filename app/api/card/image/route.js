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
// left column). The zone behind the QR is NOT white — it is the card's own pale
// blue surface, so we cover ONLY the baked-in sample QR's black modules and
// rebuild that surface underneath by inverse-distance blending of the pixels
// just outside the cover. The patch is then invisible (no photo-frame edge).
const CARD_W = 1254;
const SAMPLE = { x: 149, y: 711, w: 301, h: 306 }; // baked-in sample QR (black modules)
const FEATHER = 4;
const COVER = { x: SAMPLE.x - FEATHER, y: SAMPLE.y - FEATHER, w: SAMPLE.w + 2 * FEATHER, h: SAMPLE.h + 2 * FEATHER }; // only pixels replaced
const QR_CENTER = { x: 297, y: 856 }; // centered in the bracket frame (113..481 x 677..1036)

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
      // the zone's radial glow (brighter towards the middle, softer at corners)
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
    // (the card's own surface supplies the light background + generous quiet
    // zone, so the code blends into the card with no visible image boundary).
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
    const patchPng = await getBackgroundPatch();
    const qrSquare = await sharp(qrPng).png().toBuffer();
    const left = QR_CENTER.x - Math.round(side / 2);
    const top = QR_CENTER.y - Math.round(side / 2);
    let card = await sharp(CARD_PATH)
      .composite([
        { input: patchPng, left: COVER.x, top: COVER.y },
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
