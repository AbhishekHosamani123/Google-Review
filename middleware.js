import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isDemo() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return !url || url.includes("example") || url.includes("your-project") || url.trim() === "";
}

export async function middleware(req) {
  if (isDemo()) return NextResponse.next();
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isLogin = req.nextUrl.pathname === "/login";
  if (isDashboard && !user) return NextResponse.redirect(new URL("/login", req.url));
  if (isLogin && user) return NextResponse.redirect(new URL("/dashboard", req.url));
  return res;
}
export const config = { matcher: ["/dashboard/:path*", "/login"] };

