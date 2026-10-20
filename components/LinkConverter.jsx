"use client";
import { useState } from "react";

// Landing-page utility: paste any Google link (share.google listing share,
// g.page "Ask for reviews" link, writereview Place-ID link, maps.app.goo.gl,
// google.com/maps place URL) and get back the concrete link a customer can
// use to review the shop. Powered by /api/google/resolve.
const OK_KINDS = ["writereview", "direct-review", "listing"];

export default function LinkConverter() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { kind, title, name, url }
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function convert(e) {
    e?.preventDefault?.();
    setErr("");
    setResult(null);
    setCopied(false);
    const value = url.trim();
    if (!/^https:\/\//i.test(value)) { setErr("Paste a https:// Google link — e.g. share.google/…"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/google/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        setErr(data?.error === "not a Google link"
          ? "That link isn't a Google link. Paste a share.google/…, g.page/r/…/review, or google.com link."
          : data?.error === "https only"
            ? "Link must start with https://"
            : "Couldn't process that link — try again in a moment.");
        return;
      }
      setResult(data);
    } catch {
      setErr("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (e.g. http): fall back to selecting the text
      const el = document.getElementById("lh-resolved-url");
      if (el) { el.focus(); el.select(); }
    }
  }

  const twoTaps = result?.kind === "listing";
  const oneTap = result?.kind === "writereview" || result?.kind === "direct-review";

  return (
    <div className="rounded-card border border-cardBorder bg-surface p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-widest text-googleBlue">FREE TOOL</p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-textPrimary">
        Paste a Google link → get the review link
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-textSecondary">
        Works with any Google share link: listing shares (<span className="font-mono text-xs">share.google/…</span>),
        Google Business Profile "Ask for reviews" links (<span className="font-mono text-xs">g.page/r/…/review</span>)
        and Place&nbsp;ID review links.
      </p>

      <form onSubmit={convert} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setErr(""); }}
          placeholder="https://share.google/9VfU9h4zIdodgetro"
          className="w-full flex-1 rounded-xl border border-cardBorder bg-white px-4 py-3 text-sm font-mono text-xs focus:border-googleBlue focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-googleBlue px-5 py-3 text-sm font-bold text-white transition-opacity hover:bg-[#3367D6] disabled:opacity-50 sm:shrink-0"
        >
          {busy ? "Resolving…" : "Get review link"}
        </button>
      </form>

      {err && <p className="mt-3 text-sm font-medium text-[#C5221F]" role="alert">{err}</p>}

      {result && OK_KINDS.includes(result.kind) && (
        <div className="mt-4 rounded-xl border border-cardBorder bg-white p-4" style={{ animation: "fadeUp 220ms ease-out" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${oneTap ? "bg-[#E6F4EA] text-[#137333]" : "bg-[#E8F0FE] text-[#1967D2]"}`}>
              {oneTap ? "✓ Opens the review dialog directly" : "✓ Opens the shop's Google profile"}
            </span>
            {result.name && <span className="text-sm font-semibold text-textPrimary">{result.name}</span>}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id="lh-resolved-url"
              readOnly
              value={result.url}
              onFocus={(e) => e.target.select()}
              className="w-full flex-1 rounded-lg border border-cardBorder bg-surface px-3 py-2.5 font-mono text-[11px] text-textPrimary"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded-lg border border-cardBorder bg-white px-4 py-2.5 text-xs font-bold text-textPrimary hover:bg-white sm:shrink-0"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-textSecondary">
            {oneTap
              ? "Customers open your review box in one tap — nothing else to click."
              : "Customers see the shop's Google profile with the Review button on it. For a one-tap dialog use the \"Ask for reviews\" link from Google Business Profile (starts with g.page/r/…/review)."}
          </p>
        </div>
      )}
    </div>
  );
}
