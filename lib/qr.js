// Short card codes like the printed sample (KEJF9): 5 characters, uppercase
// letters + digits, without the ambiguous I / O / 0 / 1.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Bump when the printed-card template or QR placement changes — it busts the
// browser/CDN cache on /api/card/image so users see the new artwork at once.
export const CARD_IMAGE_VERSION = 3;
export function newCode() {
  const buf = new Uint8Array(5);
  globalThis.crypto.getRandomValues(buf);
  let s = "";
  for (const b of buf) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return s;
}
export function qrUrl(code) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/r/${code}`;
}
// Stable ordering used everywhere a QR gets its public number (QR1, QR2, ...)
// Order: created_at ascending, tie-break by code (seed rows share one timestamp).
export function sortQrs(list) {
  return [...(list || [])].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : (a.code || "").localeCompare(b.code || "")
  );
}
export function withQrNumbers(list) {
  return sortQrs(list).map((q, i) => ({ ...q, qrNum: i + 1 }));
}
// The URL printed on the card / written to the NFC chip:
//   <SITE_URL>/r/QR<n>  — permanent, shop-agnostic (works even before a shop
//   is assigned; the scan resolves the currently assigned shop live).
export function qrLinkUrl(qr) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  if (qr?.qrNum) return `${base}/r/QR${qr.qrNum}`;
  return `${base}/r/${qr?.code || ""}`;
}
export function isValidGoogleReviewUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    const allowed = ["google.com", "www.google.com", "search.google.com", "maps.google.com", "goo.gl", "maps.app.goo.gl", "g.page", "share.google"];
    return allowed.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}
