// Admin login — server-side credential check with no client-visible identity.
//
// How it works (nothing below touches the browser bundle):
//  1. The browser POSTs only the typed username + password.
//  2. This route looks up the admin user in Supabase Auth via the SERVICE role
//     key: the user whose user_metadata.username matches (case-insensitive).
//     The mapping (username -> auth identity) lives in Supabase, invisible to
//     anon traffic; the auth email is never disclosed.
//  3. The typed password is verified by Supabase Auth itself (password grant),
//     which stores only a hash — this route never needs or sees it.
//  4. On success the Supabase session tokens are returned so the browser can
//     establish its normal session with supabase-js (same as a client-side
//     sign-in, minus the identity disclosure).
//
// Optional env overrides (both set => skip step 2's scan):
//   ADMIN_USERNAME, ADMIN_AUTH_EMAIL
const SUPA_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "").trim();
const ADMIN_EMAIL = (process.env.ADMIN_AUTH_EMAIL || "").trim();

// lightweight brute-force damping: per-IP failure counter with cooldown
const fails = new Map(); // ip -> { count, until }
function rateLimited(ip) {
  const rec = fails.get(ip);
  return !!(rec && rec.until > Date.now());
}
function noteFail(ip) {
  const rec = fails.get(ip) || { count: 0, until: 0 };
  if (Date.now() > rec.until) rec.count = 0;
  rec.count += 1;
  if (rec.count >= 8) rec.until = Date.now() + 5 * 60 * 1000; // 5 min lockout
  fails.set(ip, rec);
}

async function grantPassword(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPA_ANON },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req) {
  if (!SUPA_URL || !SUPA_ANON) {
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

  try {
    // resolve the auth identity behind the typed username
    let authEmail = "";
    if (ADMIN_USERNAME && ADMIN_EMAIL) {
      // env-configured mapping (optional path)
      if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) authEmail = ADMIN_EMAIL;
    } else if (SUPA_SERVICE) {
      // metadata-driven mapping: find the user whose username matches
      const res = await fetch(`${SUPA_URL}/auth/v1/admin/users?per_page=50`, {
        headers: { apikey: SUPA_SERVICE, Authorization: `Bearer ${SUPA_SERVICE}` },
      });
      if (res.ok) {
        const list = await res.json();
        const wanted = username.toLowerCase();
        for (const u of list?.users || []) {
          const meta = u.user_metadata || {};
          const names = [meta.username, (meta.name || "").toLowerCase(), u.email ? u.email.split("@")[0].toLowerCase() : ""].filter(Boolean);
          if (names.some((n) => n.toLowerCase() === wanted)) {
            authEmail = u.email || "";
            break;
          }
        }
      }
    }

    if (!authEmail) {
      // unknown username — identical error as a wrong password (no info leak)
      noteFail(ip);
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const session = await grantPassword(authEmail, password);
    if (!session) {
      noteFail(ip);
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }
    // session trimmed for shipping: only what supabase-js.setSession() needs
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
