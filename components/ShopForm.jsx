"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidGoogleReviewUrl } from "@/lib/qr";
import { CATEGORY_OPTIONS, CATEGORY_PRESETS, moreKeywords } from "@/lib/reviews/keywords";

// True when the URL already opens Google's write-review dialog in one tap —
// those need no server resolution and are the ideal links.
function isOneTapReviewUrl(url) {
  return (url.includes("writereview") && url.includes("placeid="))
    || /^https?:\/\/(www\.)?g\.page\/r\/.+\/review/.test(url)
    || /#lrd=0x[0-9a-fA-F]+:0x[0-9a-fA-F]+/.test(url); // Google's own review-dialog share URL (copied from a listing's Review button)
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

function suggestKeywordsFromDescription(description, category) {
  const d = (description || "").toLowerCase();
  const suggestions = new Set();
  const mapping = [
    ["clean", "Spotless & Clean"],
    ["hygien", "Hygienic"],
    ["staff", "Friendly Staff"],
    ["service", "Excellent Service"],
    ["food", "Delicious Food"],
    ["price", "Great Value"],
    ["value", "Great Value"],
    ["ambian", "Beautiful Ambiance"],
    ["location", "Great Location"],
    ["doctor", "Professional Doctors"],
    ["trainer", "Expert Trainers"],
    ["coffee", "Great Coffee"],
    ["gym", "Well Managed"],
    ["equipment", "Clean Equipment"],
  ];
  for (const [kw, label] of mapping) if (d.includes(kw)) suggestions.add(label);
  const preset = CATEGORY_PRESETS[category];
  if (preset) for (const p of preset.slice(0, 3)) suggestions.add(p.label);
  return Array.from(suggestions).slice(0, 8);
}

export default function ShopForm({ shop, embedded = false, onSaved }) {
  const editing = !!shop;
  const router = useRouter();
  const [name, setName] = useState(shop?.name || "");
  const [slug, setSlug] = useState(shop?.slug || "");
  const [description, setDescription] = useState(shop?.description || "");
  const [googleUrl, setGoogleUrl] = useState(shop?.google_review_url || "");
  const [placeId, setPlaceId] = useState(shop?.google_place_id || "");
  const [address, setAddress] = useState(shop?.address || "");
  const [city, setCity] = useState(shop?.city || "");
  const [category, setCategory] = useState(shop?.category || "Restaurant");
  const [aiEnabled, setAiEnabled] = useState(shop?.ai_enabled ?? true);
  const [isActive, setIsActive] = useState(shop?.is_active ?? true);
  const [keywords, setKeywords] = useState(shop?.keywords ? (Array.isArray(shop.keywords) ? shop.keywords.join(", ") : "") : "");
  const [suggested, setSuggested] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(shop?.logo_url || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(null); // { kind, title, name, url }

  async function resolveGoogleUrl(raw) {
    const value = (raw || googleUrl).trim();
    if (!value || !isValidGoogleReviewUrl(value)) return null;
    if (isOneTapReviewUrl(value)) {
      setResolved({ kind: "writereview", title: "Opens the review dialog directly — best kind of link", url: value });
      return { kind: "writereview", url: value, title: "Opens the review dialog directly — best kind of link" };
    }
    setResolving(true);
    try {
      const res = await fetch("/api/google/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      const info = res.ok ? data : { kind: "fallback", url: value, title: "Could not verify server-side — saved as-is" };
      setResolved(info);
      return info;
    } catch {
      const info = { kind: "fallback", url: value, title: "Could not verify server-side — saved as-is" };
      setResolved(info);
      return info;
    } finally {
      setResolving(false);
    }
  }

  function onNameChange(v) {
    setName(v);
    if (!editing || !shop.slug) setSlug(slugify(v));
  }

  function applySuggestion(label) {
    const parts = keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.includes(label)) setKeywords([...parts, label].join(", "));
  }

  function genSuggestions() {
    const list = suggestKeywordsFromDescription(description, category);
    setSuggested(list);
  }

  function existingKeywordList() {
    return keywords.split(",").map((s) => s.trim()).filter(Boolean);
  }

  function genMoreKeywords() {
    const exclude = [...existingKeywordList(), ...suggested];
    let more = moreKeywords(category, exclude);
    // If nearly exhausted, fall back to a description-based second pass
    if (more.length === 0) more = suggestKeywordsFromDescription(description, category).filter((s) => !exclude.includes(s));
    setSuggested(more);
  }

  async function uploadLogo(shopId) {
    if (!logoFile) return logoPreview || null;
    if (logoFile.size > 2 * 1024 * 1024) throw new Error("Logo must be ≤2 MB");
    if (!["image/png", "image/jpeg", "image/webp"].includes(logoFile.type)) throw new Error("Logo must be PNG/JPG/WebP");
    const supabase = createClient();
    const ext = logoFile.name.split(".").pop() || "png";
    const path = `${shopId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("shop-logos").upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("shop-logos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) { setErr("Shop name is required"); return; }
    if (!slug.trim()) { setErr("Slug is required"); return; }
    if (!googleUrl.trim() || !isValidGoogleReviewUrl(googleUrl.trim())) {
      setErr("Google review URL must be a valid Google link (e.g. share.google/..., g.page/r/.../review, or search.google.com writereview link)");
      return;
    }
    setLoading(true);
    try {
      // normalize the Google link before storing: shorteners (share.google,
      // g.page listing shares) get resolved to the concrete page customers will
      // see; 1-tap review links pass through untouched.
      let finalGoogleUrl = googleUrl.trim();
      if (!isOneTapReviewUrl(finalGoogleUrl)) {
        const info = await resolveGoogleUrl(finalGoogleUrl);
        if (info && info.url && isValidGoogleReviewUrl(info.url)) finalGoogleUrl = info.url;
      }
      const supabase = createClient();
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        google_review_url: finalGoogleUrl,
        google_place_id: placeId.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        category: category.trim() || null,
        ai_enabled: aiEnabled,
        is_active: isActive,
        keywords: keywords.trim() ? keywords.split(",").map((s) => s.trim()).filter(Boolean) : null,
      };
      let shopId = shop?.id;
      let data, error;
      if (editing) {
        ({ data, error } = await supabase.from("shops").update(payload).eq("id", shop.id).select("id").single());
      } else {
        ({ data, error } = await supabase.from("shops").insert(payload).select("id").single());
        shopId = data?.id;
      }
      if (error) throw error;
      if (logoFile && shopId) {
        const logoUrl = await uploadLogo(shopId);
        if (logoUrl) {
          const { error: u2 } = await supabase.from("shops").update({ logo_url: logoUrl }).eq("id", shopId);
          if (u2) throw u2;
        }
      }
      if (embedded) {
        if (onSaved) onSaved(shopId);
        setLoading(false);
        return;
      }
      router.push("/dashboard/shops");
      router.refresh();
    } catch (e2) {
      setErr(e2.message || String(e2));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">Shop / business name *</span>
          <input value={name} onChange={(e) => onNameChange(e.target.value)} required placeholder="Pink Verranda — works for hotel, restaurant, gym, clinic..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">Slug *</span>
          <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required placeholder="pink-verranda" className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm font-mono text-xs focus:border-googleBlue focus:outline-none" />
          <span className="text-[11px] text-textSecondary">Admin only — QR uses code, not slug.</span>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">What does this shop do? — small description *</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="e.g. Family restaurant known for biryani and thali, spacious seating, quick service and warm hospitality..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20" />
        <span className="text-[11px] text-textSecondary">Used to suggest keywords below and to personalize generated reviews. Works for any business — restaurant, gym, hospital, cafe, salon...</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">Category *</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Belagavi" className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">Address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Near bus stand..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none" />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">Google review URL *</span>
        <input value={googleUrl} onChange={(e) => { setGoogleUrl(e.target.value); setResolved(null); }} onBlur={() => resolveGoogleUrl(googleUrl)} required placeholder="Paste your Google share link — share.google/..., g.page/r/.../review, or a writereview link" className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm font-mono text-xs focus:border-googleBlue focus:outline-none" />
        {resolving && <span className="mt-1 block text-[11px] text-textSecondary">Checking the link…</span>}
        {resolved && !resolving && (
          <span className={`mt-1 block text-[11px] font-medium ${resolved.kind === "writereview" || resolved.kind === "direct-review" ? "text-green-700" : resolved.kind === "unknown" ? "text-amber-700" : "text-textSecondary"}`}>
            {resolved.kind === "writereview" || resolved.kind === "direct-review"
              ? `✓ ${resolved.title}`
              : resolved.kind === "listing"
                ? `✓ Resolved${resolved.name ? ` to: ${resolved.name}` : ""} — customers land on Google with the Review button on their profile`
                : resolved.kind === "fallback"
                  ? `Link saved as-is`
                  : "Link stored as-is"}
          </span>
        )}
        <span className="mt-1 block text-[11px] text-textSecondary">
          Any Google link works: your listing "Share" link (share.google/…), the Google Business Profile → "Ask for reviews" link (g.page/r/…/review — customers land straight on the review box), or a Place ID writereview link. Linked QRs follow this URL without reprinting.
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">Google Place ID (optional)</span>
        <input value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="ChIJ..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm font-mono text-xs focus:border-googleBlue focus:outline-none" />
      </label>

      <div className="rounded-xl border border-cardBorder bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-textPrimary">Keywords — what the reviewer can tap (you control them)</span>
          <div className="flex gap-2">
            <button type="button" onClick={genSuggestions} className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-white">
              Suggest from description + category
            </button>
            <button type="button" onClick={genMoreKeywords} className="rounded-full bg-googleBlue px-3 py-1.5 text-xs font-bold text-white hover:bg-[#3367D6]">
              ⚡ Generate more keywords
            </button>
          </div>
        </div>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Warm Hospitality, Clean Rooms, Tasty Food, Expert Trainers..." className="mt-3 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none" />
        <p className="mt-1 text-[11px] text-textSecondary">Comma separated. Leave blank to use category defaults. These become the chips on the review page and shape the generated draft so it is specific to this shop.</p>
        {suggested.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggested.map((s) => (
              <button key={s} type="button" onClick={() => applySuggestion(s)} className="rounded-full border border-googleBlue bg-chipSelected px-3 py-1.5 text-xs font-semibold text-googleBlue hover:bg-white">
                + {s}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-textSecondary/70">Tip: add 4–8 keywords that match the business (gym: Clean Equipment, Expert Trainers; hospital: Caring Staff, Hygienic...). Reviews generated will weave them in naturally.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-textPrimary">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="h-4 w-4 rounded border-cardBorder text-googleBlue" />
          AI review helper (OFF = QR redirects straight to Google)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-textPrimary">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-cardBorder text-googleBlue" />
          Active
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">Shop image (optional) — shown as the big photo on the customer review page</span>
        <div className="mt-1 flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="Shop image" className="h-12 w-20 rounded-xl border border-cardBorder bg-white object-cover" />
          ) : (
            <span className="h-12 w-20 rounded-xl border border-dashed border-cardBorder bg-surface flex items-center justify-center text-textSecondary text-[10px] text-center leading-tight">No image yet</span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setLogoFile(f);
              if (f) setLogoPreview(URL.createObjectURL(f));
            }}
            className="text-sm"
          />
        </div>
        <span className="text-[11px] text-textSecondary">Upload a real photo of your shop (wide picture works best). It replaces the stock background and sits behind the shop name on the review page.</span>
      </label>

      {err && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-googleRed">{err}</p>}

      <div className="flex gap-3 pt-2">
        <button disabled={loading} className="rounded-full bg-googleBlue px-6 py-3 text-sm font-bold text-white hover:bg-[#3367D6] disabled:opacity-50">
          {loading ? "Saving..." : editing ? "Save changes" : "Create shop"}
        </button>
        {!embedded && (
          <button type="button" onClick={() => history.back()} className="rounded-full border border-cardBorder bg-white px-6 py-3 text-sm font-semibold text-textPrimary hover:bg-surface">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
