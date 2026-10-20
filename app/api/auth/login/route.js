// Admin login — server-side credential check.
//
// The username/email/password relationship is never exposed to the browser:
//  - ADMIN_USERNAME      the public-facing username (e.g. RadhaKrishna)
//  - ADMIN_AUTH_EMAIL    the internal Supabase Auth email (secret)
// The password is verified by Supabase Auth directly (it stores only a hash);
// this route never needs or sees it. On success it returns the Supabase
// session tokens so the browser can establish its normal auth session with
// supabase-js — same as a client-side login, minus the email disclosure.
const SUPA_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const USERNAME = (process.env.ADMIN_USERNAME || "").trim();
const EMAIL = (process.env.ADMIN_AUTH_EMAIL || "").trim();

// lightweight brute-force damping: per-IP failure counter with cooldown
const fails = new Map(); // ip -> { count, until }
function rateLimited(ip) {
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && rec.until > now) return true;
  return false;
}
function noteFail(ip) {
  const rec = fails.get(ip) || { count: 0, until: 0 };
  if (Date.now() > rec.until) rec.count = 0;
  rec.count += 1;
  if (rec.count >= 8) rec.until = Date.now() + 5 * 60 * 1000; // 5 min lockout
  fails.set(ip, rec);
}

export async function POST(req) {
  if (!SUPA_URL || !SUPA_ANON || !USERNAME || !EMAIL) {
    return Response.json({ error: "Login is not configured on this deployment" }, { status: 503 });
  }
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many attempts — try again in a few minutes" }, { status: 429 });
  }

  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = String(body?.username || "").trim();
    password = String(body?.password || "");
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (!username || !password) {
    return Response.json({ error: "Enter username and password" }, { status: 400 });
  }

  // username must match exactly (case-insensitive) anything else rejected
  // without touching Supabase
  if (username.toLowerCase() !== USERNAME.toLowerCase()) {
    noteFail(ip);
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPA_ANON },
      body: JSON.stringify({ email: EMAIL, password }),
    });
    if (!res.ok) {
      noteFail(ip);
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const session = await res.json();
    // session cleared for shipping: only what supabase-js.setSession() needs
    return Response.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
    });
  } catch (e) {
    return Response.json({ error: "Could not verify sign-in right now" }, { status: 502 });
  }
}
