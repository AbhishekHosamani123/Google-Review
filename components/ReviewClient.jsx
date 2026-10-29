"use client";
import { useState, useCallback, useEffect } from "react";
import { getPresetKeywords } from "@/lib/reviews/keywords";
import { generateReview } from "@/lib/reviews/templates";
import { DEFAULT_HERO } from "@/lib/config";
import { normalizeInstagramUrl, normalizeWhatsAppPhone } from "@/lib/social";
import { hasScanRecord, markScanRecord } from "@/lib/scanDedup";
import StarRating from "@/components/StarRating";
import KeywordChips from "@/components/KeywordChips";
import ToneToggle from "@/components/ToneToggle";
import ReviewPreview from "@/components/ReviewPreview";
import Toast from "@/components/Toast";
import HelpModal from "@/components/HelpModal";

// Brand icons (FontAwesome-style glyph paths — generic shapes), rendered
// white on top of each platform's official brand color. Sized by the parent
// button; inherit color via currentColor.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 448 512" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 448 512" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 438.7c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-53.6-33.4-66.7-54.7-3.3-5.6-1.4-8.7 2.5-11.7 4.2-3.1 8.5-7.4 12.8-11.1 1.9-1.7 3.5-3.6 5.3-5.4 2.3-2.4 3.1-4.2 4.6-7.2 1.1-2.5.6-4.7-.3-6.7-.9-1.9-8.3-20-11.3-27.3-3-7.1-6.1-7.6-9.3-7.5h-8.2c-2.9 0-7.6 1.1-11.5 5.4-3.9 4.3-15 14.5-15 35.5 0 21 15.3 41.2 17.5 44.6 2.2 3.4 30 45.8 72.6 64.2 10.1 4.4 18 7 24.2 8.9 10.2 3.2 19.5 2.8 26.8 1.7 8.2-1.2 26.9-11 30.8-21.7 3.8-10.7 3.8-19.9 2.7-21.7-1.1-2-3.9-3.2-8.3-5z" />
    </svg>
  );
}

// Shared styling for the compact social/contact buttons on the review page —
// white glyph on each platform's own brand color, subtle shadow and ring.
const SOCIAL_BTN_BASE =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-white shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95";
const INSTAGRAM_BTN = `${SOCIAL_BTN_BASE} hover:brightness-110 focus-visible:ring-[#c13584]`;
const WHATSAPP_BTN = `${SOCIAL_BTN_BASE} bg-[#25D366] hover:brightness-105 focus-visible:ring-[#25D366]`;
// Instagram's official five-stop brand gradient (catalog spec)
const INSTAGRAM_GRADIENT = "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)";

// Numbered step coin for the guided flow (Google blue, like the mockup's circles)
function StepBadge({ n }) {
  return (
    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-googleBlue text-xs font-bold text-white shadow-sm" aria-hidden="true">
      {n}
    </span>
  );
}

function resolveKeywords(shop) {  const hasCustom = shop.keywords && Array.isArray(shop.keywords) && shop.keywords.length;
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

// Public social links — rendered only when a valid value exists; anything
// disabled/absent/invalid renders nothing (no empty placeholders).
const instagramHref = normalizeInstagramUrl(shop.instagram_url);
const wa = normalizeWhatsAppPhone(shop.whatsapp_phone);
const whatsappHref = wa.ok ? wa.url : null;
const hasSocial = !!(instagramHref || whatsappHref);

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

      <main className="mx-auto max-w-[640px] px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        <div className="overflow-hidden rounded-card border border-cardBorder bg-white shadow-raised" style={{ animation: "fadeUp 300ms ease-out" }}>
          <div className="relative h-[210px] w-full overflow-hidden bg-surface sm:h-[230px]">
            <img src={hero} alt={shop.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
            {(shop.address || shop.city) && (
              <div className="absolute right-0 top-0 m-3 flex max-w-[70%] items-start gap-1 rounded-xl bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
                <span className="material-symbols-rounded shrink-0 text-white" style={{ fontSize: 15 }}>
                  location_on
                </span>
                <span className="text-[11px] font-medium leading-tight text-white">
                  {[shop.address, shop.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <h1 className="font-serif text-[26px] font-bold leading-none tracking-tight text-white drop-shadow sm:text-[32px]">{shop.name}</h1>
              {shop.category && (
                <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                  · {shop.category} ·
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-textPrimary shadow-sm">
                  4.8
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: "#FBBC04", fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-normal text-textSecondary">· Reviews on Google</span>
                </span>
                {qr?.scans_count > 0 && (
                  <>
                    <span className="hidden text-white/40 sm:inline">|</span>
                    <span className="text-xs font-medium text-white/90">
                      Loved by {Number(qr.scans_count).toLocaleString()}+ customers
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <h2 className="font-serif text-[26px] font-bold leading-tight text-textPrimary sm:text-[30px]">Loved your visit?</h2>
            <p className="mt-1.5 text-[16px] font-bold leading-snug text-textPrimary sm:text-[17px]">
              Your review takes just <span className="text-googleBlue">10 seconds.</span>
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-textSecondary">
              Tap what you liked, pick a tone, and we&apos;ll draft your review — edit anything, then post to Google.
              <span className="font-medium text-textPrimary"> Genuine visits only.</span>
            </p>

            <div className="mt-4 border-t border-cardBorder pt-4">
              <span className="text-xs font-bold uppercase tracking-wide text-textSecondary">Your rating</span>
              <div className="mt-2">
                <StarRating value={stars} onChange={setStars} />
              </div>
              {stars <= 3 && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  Thanks for your honesty. Share what went well and what could improve.
                </p>
              )}
            </div>
            {hasSocial && (
              <div className="mt-3 flex items-center gap-2 border-t border-cardBorder pt-3">
                {instagramHref && (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${shop.name} on Instagram`}
                    title="Instagram"
                    className={INSTAGRAM_BTN}
                    style={{ background: INSTAGRAM_GRADIENT }}
                  >
                    <InstagramIcon />
                  </a>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Chat with ${shop.name} on WhatsApp`}
                    title="WhatsApp"
                    className={WHATSAPP_BTN}
                  >
                    <WhatsAppIcon />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="mt-5 rounded-card border border-cardBorder bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-2.5">
            <StepBadge n={1} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold leading-tight text-textPrimary">What did you love?</h3>
              <p className="mt-0.5 text-xs text-textSecondary">Tap up to 5 highlights.</p>
            </div>
            <span className="text-xs font-medium text-textSecondary">{selected.length}/5 selected</span>
          </div>
          <div className="mt-4 sm:pl-[38px]">
            <KeywordChips keywords={keywords} selectedIds={selected} onToggle={toggle} />
          </div>
        </section>

        <section className="mt-5 rounded-card border border-cardBorder bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-2.5">
            <StepBadge n={2} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold leading-tight text-textPrimary">Tone</h3>
              <p className="mt-0.5 text-xs text-textSecondary">How should your review sound?</p>
            </div>
          </div>
          <div className="mt-4 sm:pl-[38px]">
            <ToneToggle value={tone} onChange={setTone} />
          </div>
        </section>

        <div className="mt-6">
          <button
            type="button"
            onClick={doGenerate}
            disabled={!canGenerate}
            className={[
              "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[16px] font-bold shadow-card transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-2",
              canGenerate
                ? "bg-[linear-gradient(90deg,#4285F4,#1A73E8)] text-white hover:brightness-105 hover:shadow-cardHover active:scale-[0.99]"
                : "border border-cardBorder bg-white text-textSecondary cursor-not-allowed",
            ].join(" ")}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
              auto_awesome
            </span>
            Generate my review
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
              arrow_forward
            </span>
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

        {hasGenerated && <div className="mt-6" style={{ animation: "fadeUp 250ms ease-out" }}>
          <ReviewPreview
            text={review}
            setText={setReview}
            onRegenerate={doGenerate}
            onCopy={copyAndOpen}
            mascotSrc={mascotSrc}
          />
          <p className="mt-2 text-center text-[11px] text-textSecondary">
            Your draft is copied for you — just paste it on Google and tap <b className="text-textPrimary">Post</b>.
          </p>
        </div>}

        <footer className="mt-8 border-t border-cardBorder pt-6 pb-2 text-center">
          <p className="text-xs leading-relaxed text-textSecondary">
            Your feedback helps us grow{" "}
            <span aria-hidden="true">❤️</span> Thank you for supporting{" "}
            <span className="font-medium text-textPrimary">{shop.name}!</span>
          </p>
        </footer>
      </main>
      <Toast message={toast} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} reviewUrl={reviewUrl} reviewText={review} />
    </div>
  );
}
