// Social link helpers — Instagram profile URLs and WhatsApp click-to-chat.

// Normalizes an Instagram profile URL to https://www.instagram.com/<username>/
// Accepts instagram.com, www.instagram.com, m.instagram.com, with or without
// the https:// prefix and with or without a trailing slash. Returns null when
// the input is not a recognizable Instagram profile link.
export function normalizeInstagramUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!["instagram.com", "m.instagram.com", "instagr.am"].includes(host)) return null;
  const path = u.pathname.replace(/^\/+|\/+$/g, "").replace(/^@/, "");
  if (!path) return null;
  const segments = path.split("/");
  const username = segments[0];
  // Instagram usernames: letters, digits, dot, underscore (1..30 chars) —
  // reject post/reel/story paths and anything sub-path after the username is
  // ignored (profile links are canonical without them)
  if (!username || !/^[A-Za-z0-9._]{1,30}$/.test(username)) return null;
  if (/^(p|reel|reels|tv|stories|explore|accounts|direct|directs|share)$/i.test(username)) return null;
  return `https://www.instagram.com/${username}/`;
}

export function isValidInstagramUrl(url) {
  return !!normalizeInstagramUrl(url);
}

// Normalizes a phone number into plain international digits for wa.me links:
//   "+91 98765 43210" / "919876543210" / "09876543210" / "9876543210"
//   -> { ok: true, phone: "919876543210", url: "https://wa.me/919876543210" }
// No spaces, brackets, hyphens or symbols survive (wa.me accepts digits only).
// A bare 10-digit number is treated as an Indian number without the country
// code; 0-prefixed 11-digit trunk numbers get their leading 0 dropped.
export function normalizeWhatsAppPhone(raw) {
  const value = String(raw || "").trim();
  if (!value) return { ok: false, phone: "", url: "", error: "empty" };
  let digits = value.replace(/\D/g, "");
  if (!digits) return { ok: false, phone: "", url: "", error: "no digits" };
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1); // 0-prefixed trunk number
  if (digits.length === 10) digits = `91${digits}`; // Indian number without country code
  // E.164: country code + subscriber number = 8..15 digits total
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, phone: digits, url: "", error: "digit count" };
  }
  return { ok: true, phone: digits, url: `https://wa.me/${digits}` };
}
