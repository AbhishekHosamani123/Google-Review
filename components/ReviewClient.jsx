"use client";
import { useState, useCallback, useEffect } from "react";
import { getPresetKeywords } from "@/lib/reviews/keywords";
import { generateReview } from "@/lib/reviews/templates";
import { DEFAULT_HERO } from "@/lib/config";
import { hasScanRecord, markScanRecord } from "@/lib/scanDedup";
import StarRating from "@/components/StarRating";
import KeywordChips from "@/components/KeywordChips";
import ToneToggle from "@/components/ToneToggle";
import ReviewPreview from "@/components/ReviewPreview";
import Toast from "@/components/Toast";
import HelpModal from "@/components/HelpModal";

function resolveKeywords(shop) {
  const hasCustom = shop.keywords && Array.isArray(shop.keywords) && shop.keywords.length;
  const raw = hasCustom
    ? shop.keywords.map((label) => ({ label, phrase: String(label).toLowerCase() }))
    : getPresetKeywords(shop.category) || [];
  // every chip needs a UNIQUE id — category presets are defined label-only, and
  // undefined ids made every chip select/deselect together
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return raw
    .map((k) => ({ label: String(k.label ?? ""), phrase: String(k.phrase ?? k.label ?? "").toLowerCase() }))
    .filter((k) => k.label)
    .map((k, i) => ({
      id: k.id || `kw-${i}-${slug(k.label)}`,
      label: k.label,
      phrase: k.phrase,
    }));
}

export default function ReviewClient({ shop, qr }) {
  const keywords = resolveKeywords(shop);
  const reviewUrl = shop.google_review_url;
  const [stars, setStars] = useState(5);
  const [tone, setTone] = useState("friendly");
  const [selected, setSelected] = useState([]);
  const [review, setReview] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [toast, setToast] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  // Pre-warm the writing mascot into a blob URL while the visitor picks
  // highlights, so it plays instantly the moment they hit Generate.
  const [mascotSrc, setMascotSrc] = useState("/mascot.mp4");
  useEffect(() => {
    let alive = true;
    fetch("/mascot.mp4")
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b && alive) setMascotSrc(URL.createObjectURL(b));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev));
  }, []);

  // Count this visitor once per shop — the browser keeps the memory, not the DB.
  useEffect(() => {
    if (!shop?.id || !qr?.id) return;
    if (hasScanRecord(shop.id)) return;
    markScanRecord(shop.id);
    fetch("/api/track/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_code_id: qr.id, shop_id: shop.id, event_type: "scan" }),
    }).catch(() => {});
  }, [shop?.id, qr?.id]);

  const canGenerate = selected.length > 0;  const doGenerate = useCallback(() => {
    if (!canGenerate) return;
    const chips = selected.map((id) => keywords.find((k) => k.id === id)).filter(Boolean);
    const text = generateReview({ chips, tone, stars, shopName: shop.name, shopCategory: shop.category, shopCity: shop.city, description: shop.description });
    // Direct result — no artificial writing phase; the draft card (with the
    // mascot in its header) appears instantly.
    setReview(text);
    setHasGenerated(true);
    setTimeout(() => document.getElementById("review-section")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, [canGenerate, selected, tone, stars, shop.name, shop.category, shop.city, shop.description, keywords]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }, []);

  const copyAndOpen = useCallback(async () => {
    if (!review.trim()) return;
    let copied = false;
    try {
      await navigator.clipboard.writeText(review);
      copied = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = review;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }
    fetch("/api/track/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_code_id: qr.id, shop_id: shop.id, event_type: "copy_open_google" }),
    }).catch(() => {});
    if (copied) showToast("Copied! Opening Google Reviews...");
    else showToast("Copy failed - use the popup");
    const win = window.open(reviewUrl, "_blank", "noopener");
    if (!win) setHelpOpen(true);
    else if (!copied) setTimeout(() => setHelpOpen(true), 400);
  }, [review, reviewUrl, shop.id, qr.id, showToast]);

  const hero = shop.logo_url || DEFAULT_HERO;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-cardBorder bg-white/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-[640px] items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <span className="truncate text-base font-bold tracking-tight text-textPrimary sm:text-lg">{shop.name}</span>
          <img src="/radhakrishna-logo.png" alt="Radha Krishna" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-25" style={{ width: 10, height: 10 }} />
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textSecondary sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-googleGreen" /> Review on Google
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
        <div className="overflow-hidden rounded-card border border-cardBorder bg-white shadow-raised" style={{ animation: "fadeUp 300ms ease-out" }}>
          <div className="relative h-[190px] w-full overflow-hidden bg-surface sm:h-[220px]">
            <img src={hero} alt={shop.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <h1 className="text-[20px] font-bold leading-none text-white drop-shadow sm:text-[22px]">{shop.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-textPrimary shadow-sm">
                  4.8
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: "#FBBC04", fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-normal text-textSecondary"> - Reviews on Google</span>
                </span>
                {(shop.city || shop.category) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                      location_on
                    </span>
                    {[shop.city, shop.category].filter(Boolean).join(" - ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-5">
            <h2 className="text-[18px] font-bold leading-tight text-textPrimary sm:text-[20px]">Loved your visit? Your review takes 10 seconds.</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-textSecondary">
              Tap what you liked, pick a tone, and we&apos;ll draft your review — edit anything, then post to Google.
              <span className="font-medium text-textPrimary"> Genuine visits only.</span>
            </p>
          </div>
        </div>

        <section className="mt-5 rounded-card border border-cardBorder bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-textPrimary">Your rating</h3>
          <div className="mt-3">
            <StarRating value={stars} onChange={setStars} />
          </div>
          {stars <= 3 && (
            <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs leading-relaxed text-amber-800">
              Thanks for your honesty. Share what went well and what could improve.
            </p>
          )}
        </section>

        <section className="mt-5 rounded-card border border-cardBorder bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-textPrimary">What did you love?</h3>
            <span className="text-xs font-medium text-textSecondary">{selected.length}/5 selected</span>
          </div>
          <p className="mt-1 text-xs text-textSecondary">Tap up to 5 highlights.</p>
          <div className="mt-4">
            <KeywordChips keywords={keywords} selectedIds={selected} onToggle={toggle} />
          </div>
        </section>

        <section className="mt-5 rounded-card border border-cardBorder bg-white p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-textPrimary">Tone</h3>
          <p className="mt-1 text-xs text-textSecondary">How should your review sound?</p>
          <div className="mt-4">
            <ToneToggle value={tone} onChange={setTone} />
          </div>
        </section>

        <div className="mt-6">
          <button
            type="button"
            onClick={doGenerate}
            disabled={!canGenerate}
            className={[
              "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-bold shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-2",
              canGenerate
                ? "bg-googleBlue text-white hover:bg-[#3367D6] active:scale-[0.99]"
                : "bg-white border border-cardBorder text-textSecondary cursor-not-allowed",
            ].join(" ")}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
              auto_awesome
            </span>
            Generate my review
          </button>
          {!canGenerate && !hasGenerated && <p className="mt-2 text-center text-xs text-textSecondary">Select at least one highlight above to generate.</p>}
          {hasGenerated && (
            <p id="review-section" className="mt-2 text-center text-xs font-medium text-googleGreen flex items-center justify-center gap-1">
              <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              Draft ready - edit below, then copy and open Google
            </p>
          )}
        </div>

        {hasGenerated && (
          <div className="mt-6" style={{ animation: "fadeUp 250ms ease-out" }}>
            <ReviewPreview text={review} setText={setReview} onRegenerate={doGenerate} mascotSrc={mascotSrc} />
          </div>
        )}

        {hasGenerated && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cardBorder bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-[640px] gap-3 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={doGenerate}
                className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full border border-cardBorder bg-white px-5 py-3 text-sm font-semibold text-textPrimary hover:bg-surface"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  refresh
                </span>
                Regenerate
              </button>
              <button
                type="button"
                onClick={copyAndOpen}
                disabled={!review.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-googleBlue px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#3367D6] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  content_copy
                </span>
                Copy and open Google Reviews
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  open_in_new
                </span>
              </button>
            </div>
            <p className="pb-2 text-center text-[11px] text-textSecondary">
              Your draft is copied for you — just paste it on Google and tap <b className="text-textPrimary">Post</b>.
            </p>
          </div>
        )}

        <footer className="mt-8 border-t border-cardBorder pt-6 pb-2 text-center">
          <p className="text-xs text-textSecondary">Draft — edit freely before posting on Google.</p>
        </footer>
      </main>
      <Toast message={toast} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} reviewUrl={reviewUrl} reviewText={review} />
    </div>
  );
}
