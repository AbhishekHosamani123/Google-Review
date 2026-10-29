"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidGoogleReviewUrl } from "@/lib/qr";
import { normalizeInstagramUrl, normalizeWhatsAppPhone } from "@/lib/social";
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
  const [ownerName, setOwnerName] = useState(shop?.owner_name || "");
  const [ownerPhone, setOwnerPhone] = useState(shop?.owner_phone || "");
  const [category, setCategory] = useState(shop?.category || "Restaurant");
  const [aiEnabled, setAiEnabled] = useState(shop?.ai_enabled ?? true);
  const [isActive, setIsActive] = useState(shop?.is_active ?? true);
  const [keywords, setKeywords] = useState(shop?.keywords ? (Array.isArray(shop.keywords) ? shop.keywords.join(", ") : "") : "");
  const [suggested, setSuggested] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(shop?.logo_url || "");
  const [dragOver, setDragOver] = useState(false);
  const [fileErr, setFileErr] = useState("");

  // Optional social links — each has its own independent toggle so either one
  // can exist alone. Toggling OFF clears the saved value on save (removes the
  // link), toggling ON reveals the input and keeps the saved value for editing.
  const [addInstagram, setAddInstagram] = useState(!!shop?.instagram_url);
  const [instagramUrl, setInstagramUrl] = useState(shop?.instagram_url || "");
  const [addWhatsApp, setAddWhatsApp] = useState(!!shop?.whatsapp_phone);
  const [whatsappPhone, setWhatsappPhone] = useState(shop?.whatsapp_phone ? `+${shop.whatsapp_phone}` : "");

  // shared file picker for the drag-drop zone + the browse input
  function pickFile(f) {
    setFileErr("");
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setFileErr("Image must be 5 MB or smaller"); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) { setFileErr("Only PNG, JPG or WebP images are allowed"); return; }
    setLogoFile(f);
    if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(f));
  }
  function removePickedFile() {
    setFileErr("");
    setLogoFile(null);
    if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(shop?.logo_url || "");
  }
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
    // fresh listings (not set up yet) keep the slug tracking the name; real
    // shops keep their slug stable after creation
    if (!editing || !shop.slug || !shop.google_review_url) setSlug(slugify(v));
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
    if (logoFile.size > 5 * 1024 * 1024) throw new Error("Logo must be ≤5 MB");
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
    if (!googleUrl.trim() || !isValidGoogleReviewUrl(googleUrl.trim())) {
      setErr("Google review URL must be a valid Google link (e.g. share.google/..., g.page/r/.../review, or search.google.com writereview link)");
      return;
    }
    if (ownerPhone.trim() && !/^[+()0-9\-\s]{4,20}$/.test(ownerPhone.trim())) {
      setErr("Owner phone number looks wrong — use digits with optional +, spaces or dashes"); return;
    }
    // social links — optional, validated only when filled in
    const igNormalized = normalizeInstagramUrl(instagramUrl);
    if (addInstagram && instagramUrl.trim() && !igNormalized) {
      setErr("Instagram URL must be a valid profile link, e.g. https://www.instagram.com/yourbusiness/");
      return;
    }
    const wa = normalizeWhatsAppPhone(whatsappPhone);
    if (addWhatsApp && whatsappPhone.trim() && !wa.ok) {
      setErr(wa.error === "digit count"
        ? "WhatsApp number looks wrong — include the full number with country code, e.g. +91 98765 43210"
        : "WhatsApp number must contain digits only");
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
      const finalSlug = slug.trim() || slugify(name); // slug is derived automatically — not user-editable anymore
      const payload = {
        name: name.trim(),
        slug: finalSlug,
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
      // owner fields go through only when this shop carries owner data, so a
      // deployment ahead of the database upgrade never fails to save
      if (ownerName.trim() || ownerPhone.trim() || shop?.owner_name || shop?.owner_phone) {
        payload.owner_name = ownerName.trim() || null;
        payload.owner_phone = ownerPhone.trim() || null;
      }
      // social fields — same guarded-send pattern: saves on databases that
      // haven't got the columns yet keep working, and toggling a platform OFF
      // stores null for that platform only (the other one's data stays intact)
      if (addInstagram || addWhatsApp || shop?.instagram_url || shop?.whatsapp_phone) {
        payload.instagram_url = addInstagram && igNormalized ? igNormalized : null;
        payload.whatsapp_phone = addWhatsApp && wa.ok ? wa.phone : null;
      }
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
      const msg = e2.message || String(e2);
      setErr(
        /owner_name|owner_phone/.test(msg) && /column|schema cache|could not find/i.test(msg)
          ? "Database upgrade pending — open Supabase → SQL Editor, run the owner-fields script, then press Save again."
          : /instagram_url|whatsapp_phone/.test(msg) && /column|schema cache|could not find/i.test(msg)
            ? "Database upgrade pending — open Supabase → SQL Editor, run supabase/add-social-links.sql, then press Save again."
            : msg
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">Shop name *</span>
        <input value={name} onChange={(e) => onNameChange(e.target.value)} required placeholder="Pink Varanda — hotel, restaurant, gym, clinic..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20" />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">About the shop *</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Family restaurant known for biryani, quick service and clean seating..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20" />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">Shop owner name</span>
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Rajesh Kumar" className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-textPrimary">Shop owner phone number</span>
          <input type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none" />
        </label>
        <span className="text-[11px] text-textSecondary sm:col-span-2">Only you can see this — it stays with the shop record.</span>
      </div>

      {/* Social links — two independent optional toggles */}
      <div className="rounded-xl border border-cardBorder bg-surface p-4">
        <span className="text-xs font-bold text-textPrimary">Social links (optional)</span>
        <p className="mt-0.5 text-[11px] text-textSecondary">Shown as small icons on your public review page.</p>

        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-textPrimary">
          <input type="checkbox" checked={addInstagram} onChange={(e) => setAddInstagram(e.target.checked)} className="h-4 w-4 rounded border-cardBorder text-googleBlue" />
          Add Instagram
        </label>
        {addInstagram && (
          <label className="mt-2 block">
            <span className="text-xs font-semibold text-textPrimary">Instagram profile URL</span>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/yourbusiness/"
              className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20"
            />
          </label>
        )}

        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-textPrimary">
          <input type="checkbox" checked={addWhatsApp} onChange={(e) => setAddWhatsApp(e.target.checked)} className="h-4 w-4 rounded border-cardBorder text-googleBlue" />
          Add WhatsApp
        </label>
        {addWhatsApp && (
          <label className="mt-2 block">
            <span className="text-xs font-semibold text-textPrimary">WhatsApp phone number</span>
            <input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20"
            />
            <span className="mt-1 block text-[11px] text-textSecondary">Include the country code — bare 10-digit numbers are saved as +91 automatically.</span>
          </label>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">Google review link *</span>
        <input value={googleUrl} onChange={(e) => { setGoogleUrl(e.target.value); setResolved(null); }} onBlur={() => resolveGoogleUrl(googleUrl)} required placeholder="Paste any Google link (share.google/..., g.page/..., Maps link...)" className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm font-mono text-xs focus:border-googleBlue focus:outline-none" />
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
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-textPrimary">Google Place ID (optional)</span>
        <input value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="ChIJ..." className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm font-mono text-xs focus:border-googleBlue focus:outline-none" />
      </label>

      <div className="rounded-xl border border-cardBorder bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-textPrimary">Review keywords</span>
          <div className="flex gap-2">
            <button type="button" onClick={genSuggestions} className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-white">
              Suggest
            </button>
            <button type="button" onClick={genMoreKeywords} className="rounded-full bg-googleBlue px-3 py-1.5 text-xs font-bold text-white hover:bg-[#3367D6]">
              ⚡ More
            </button>
          </div>
        </div>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Warm Hospitality, Clean Rooms, Tasty Food..." className="mt-3 w-full rounded-xl border border-cardBorder bg-white px-3.5 py-2.5 text-sm focus:border-googleBlue focus:outline-none" />
        <p className="mt-1 text-[11px] text-textSecondary">Comma separated — these become the tappable chips on the review page.</p>
        {suggested.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggested.map((s) => (
              <button key={s} type="button" onClick={() => applySuggestion(s)} className="rounded-full border border-googleBlue bg-chipSelected px-3 py-1.5 text-xs font-semibold text-googleBlue hover:bg-white">
                + {s}
              </button>
            ))}
          </div>
        )}
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
        <span className="text-xs font-semibold text-textPrimary">Shop photo (optional)</span>
        <input
          id="shop-img-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            pickFile(e.target.files?.[0] || null);
            e.target.value = ""; // allow re-selecting the same file
          }}
          className="hidden"
        />
        <div
          role="button"
          tabIndex={-1}
          onClick={() => {
            const input = document.getElementById("shop-img-input");
            if (input) input.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer?.files?.[0] || null);
          }}
          className={[
            "mt-2 flex cursor-pointer select-none items-center gap-4 rounded-xl border-2 p-3 transition-colors",
            dragOver ? "border-googleBlue bg-chipSelected" : "border-dashed border-cardBorder bg-surface hover:border-googleBlue/60",
          ].join(" ")}
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Shop image" className="h-16 w-24 shrink-0 rounded-xl border border-cardBorder bg-white object-cover" />
          ) : (
            <span className="material-symbols-rounded shrink-0 text-googleBlue" style={{ fontSize: 34 }}>
              add_photo_alternate
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-textPrimary">{dragOver ? "Drop to upload" : "Drag & drop your image here"}</p>
            <p className="mt-0.5 text-[11px] text-textSecondary">or click to browse — PNG, JPG or WebP, up to 5 MB</p>
          </div>
        </div>
        {fileErr && <p className="mt-1.5 text-[11px] font-semibold text-googleRed">{fileErr}</p>}
        {logoFile && (
          <button type="button" onClick={removePickedFile} className="mt-1.5 text-[11px] font-semibold text-googleRed hover:underline">
            Remove image
          </button>
        )}
      </label>

      {err && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-googleRed">{err}</p>}

      <div className="sticky bottom-4 z-20 mt-6">
        <div className="flex items-center gap-2 rounded-2xl bg-googleBlue p-2 shadow-lg shadow-googleBlue/30">
          {!embedded && (
            <button type="button" onClick={() => history.back()} className="shrink-0 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/25">
              Cancel
            </button>
          )}
          <button disabled={loading} className="flex-1 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/25 disabled:opacity-50">
            {loading ? "Saving..." : editing ? "Save changes" : "Create shop"}
          </button>
        </div>
      </div>
    </form>
  );
}
