"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo";
import Link from "next/link";

// Admin login through the server (/api/auth/login): the browser only ever
// sends the typed username + password — the underlying auth identity lives
// server-side and never appears in the bundle.
export default function LoginPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (demo) {
      localStorage.setItem("demo_admin", "1");
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Invalid username or password");
        setLoading(false);
        return;
      }
      // establish the normal supabase session from the verified tokens
      const supabase = createClient();
      const { error: sErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sErr) {
        setErr("Signed in but session could not start — try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard/shops");
      router.refresh();
    } catch (e2) {
      setErr("Network problem — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-cardBorder bg-white p-6 shadow-raised">
        <Link href="/" className="text-xs font-bold tracking-tight text-textPrimary flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-googleBlue text-xs font-bold text-white">R</span> ReviewHub
        </Link>
        <h1 className="mt-4 text-xl font-bold text-textPrimary">Admin login</h1>
        <p className="mt-1 text-sm text-textSecondary">{demo ? "Demo mode — click Sign in to enter the dashboard (no Supabase needed)." : "Single admin account. Credentials are verified server-side."}</p>
        {demo && <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">Demo: all data is local, resets on refresh. Connect Supabase to make it persistent.</div>}
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-textPrimary">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required={!demo}
              placeholder={demo ? "demo (anything)" : "Your admin username"}
              className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary/50 focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-textPrimary">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required={!demo}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20"
            />
          </label>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-googleRed">{err}</p>}
          <button disabled={loading} className="w-full rounded-full bg-googleBlue px-6 py-3 text-sm font-bold text-white hover:bg-[#3367D6] disabled:opacity-50">
            {loading ? "Signing in..." : demo ? "Enter demo dashboard →" : "Sign in"}
          </button>
        </form>
        <Link href="/" className="mt-4 block text-center text-xs font-medium text-textSecondary hover:text-textPrimary">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
