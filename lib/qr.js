import { nanoid } from "nanoid";
export function newCode(length = 8) {
  return nanoid(length);
}
export function qrUrl(code) {
  return `${qrBase()}/r/${code}`;
}
// The card/NFC links must always point at the LIVE domain. In the browser use
// the current origin; on the server prefer the request host passed in, and only
// fall back to NEXT_PUBLIC_SITE_URL as a last resort (never localhost by
// accident on a deployed site).
export function qrBase(requestBase) {
  if (typeof window !== "undefined") return window.location.origin;
  const fromReq = (requestBase || "").replace(/\/$/, "");
  if (fromReq) return fromReq;
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (envBase && !/localhost|127\.0\.0\.1/.test(envBase)) return envBase;
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || "localhost:3000"}`;
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
//   <SITE_URL>/r/Radha<n>  — permanent, shop-agnostic (works even before a shop
//   is assigned; the scan resolves the currently assigned shop live).
// Legacy /r/QR<n> links keep working too (see ReviewPage).
export function qrLinkUrl(qr, requestBase) {
  const base = qrBase(requestBase).replace(/\/$/, "");
  if (qr?.qrNum) return `${base}/r/Radha${qr.qrNum}`;
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
