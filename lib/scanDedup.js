// Unique-user scan memory — lives ONLY in the user's browser (localStorage).
// Nothing about the user is sent or stored on the server: the client simply
// decides whether this visit is the user's first for a given shop and, if so,
// fires a single counter increment to /api/track/scan.
const KEY = "rh_seen_shops_v1";

function readAll() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(obj) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {}
}

export function hasScanRecord(shopId) {
  if (!shopId) return false;
  return readAll()[shopId] != null;
}

export function markScanRecord(shopId) {
  if (!shopId) return;
  const all = readAll();
  all[shopId] = { at: Date.now() };
  writeAll(all);
}
