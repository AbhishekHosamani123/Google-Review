import Link from "next/link";
import LinkConverter from "@/components/LinkConverter";
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-cardBorder bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-bold tracking-tight text-textPrimary flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-googleBlue text-xs font-bold text-white">R</span>
            ReviewHub
          </span>
          <Link href="/login" className="rounded-full bg-textPrimary px-5 py-2 text-sm font-semibold text-white hover:bg-black">Admin login</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-widest text-googleBlue">REVMEAI-INSPIRED · MULTI-SHOP</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-textPrimary sm:text-6xl">
            One NFC card.<br />Any shop. Instant<br /><span className="text-googleBlue">Google reviews.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-textSecondary">
            Generate unique QR codes, assign any shop, and redirect without reprinting.
            Each scan lands on a branded review helper — no LLM, no credits, just templates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-googleBlue px-6 py-3 text-sm font-bold text-white hover:bg-[#3367D6]">Open dashboard</Link>
            <Link href="/login" className="rounded-full border border-cardBorder bg-white px-6 py-3 text-sm font-semibold text-textPrimary hover:bg-surface">How it works</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-textSecondary">
            <span className="rounded-full border border-cardBorder px-3 py-1.5">Dynamic QR · redirect without reprint</span>
            <span className="rounded-full border border-cardBorder px-3 py-1.5">PNG logo · H-correction QR</span>
            <span className="rounded-full border border-cardBorder px-3 py-1.5">Vercel + Supabase</span>
          </div>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            ["1 · Create shop", "Add name, Google review URL, PNG logo, keywords and AI toggle."],
            ["2 · Assign QR", "Pick from 10 pre-made codes or generate new. Each QR = yoursite.com/r/<code>."],
            ["3 · Customer scans", "Branded helper (stars, chips, generate, copy→Google) or direct redirect if AI off."],
          ].map(([t,d])=> (
            <div key={t} className="rounded-card border border-cardBorder bg-surface p-5">
              <p className="text-sm font-bold text-textPrimary">{t}</p><p className="mt-1 text-sm leading-relaxed text-textSecondary">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-textSecondary/70">
          NFC: write <code className="rounded bg-surface border border-cardBorder px-1 py-0.5">/r/&lt;code&gt;</code> as URI on NTAG213 · QR: print ≥2×2 cm, H-correction · Change a shop’s Google URL anytime — every linked QR moves with it.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <LinkConverter />
      </section>
    </div>
  );
}
