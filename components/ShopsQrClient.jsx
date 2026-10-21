"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { qrLinkUrl, withQrNumbers, newCode } from "@/lib/qr";
import ShopForm from "@/components/ShopForm";
import Toast from "@/components/Toast";

// Stable numbering: QR1, QR2, ... in created order (created_at, then code)
function withNumbers(list) {
  return [...list]
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : (a.code || "").localeCompare(b.code || "")))
    .map((q, i) => ({ ...q, qrNum: i + 1 }));
}

const PLACEHOLDER_FALLBACK = {
  description: "To be set up",
  category: "Other",
  keywords: [],
  google_review_url: "",
};

export default function ShopsQrClient({ shops: initialShops, qrs: initialQrs, demo }) {
  const router = useRouter();
  const [shops, setShops] = useState(initialShops || []);
  const [qrs, setQrs] = useState(initialQrs || []);
  // fullscreen overlay mode: "edit" = shop setup options only; "card" = the
  // printed card + QR + NFC link only
  const [openId, setOpenId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(null);
  const [err, setErr] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // keep local state in sync when the server re-renders with fresh data
  useEffect(() => { setShops(initialShops || []); }, [initialShops]);
  useEffect(() => { setQrs(initialQrs || []); }, [initialQrs]);

  const numbered = withQrNumbers(qrs);
  const openQr = numbered.find((q) => q.id === openId) || null;
  const openShop = openQr ? shops.find((s) => s.id === openQr.shop_id) || null : null;
  const isUntouched = openQr && (!openShop || !openShop.google_review_url);

  // lock page scroll while the fullscreen overlay is open
  useEffect(() => {
    document.body.style.overflow = openId ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openId]);

  function flashCopied(key) {
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleSaved() {
    setOpenId(null);
    setSavedMsg("Saved! Your QR card is up to date.");
    setTimeout(() => setSavedMsg(""), 3000);
    if (!demo) router.refresh();
  }

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    flashCopied(key);
  }

  async function toggleActive(qr) {
    if (demo) {
      setQrs((p) => p.map((x) => (x.id === qr.id ? { ...x, is_active: !x.is_active } : x)));
      return;
    }
    setBusy(qr.id);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("qr_codes").update({ is_active: !qr.is_active }).eq("id", qr.id);
    if (error) setErr(error.message);
    else setQrs((p) => p.map((x) => (x.id === qr.id ? { ...x, is_active: !x.is_active } : x)));
    setBusy(null);
  }

  // Generate a brand-new unique QR: creates its own fresh listing and opens
  // the fullscreen setup (editing) for that card automatically.
  async function generateOne() {
    setBusy("new");
    setErr("");
    const code = newCode(8);
    if (demo) {
      const local = [{ id: `qr-${Date.now()}`, code, shop_id: `shop-${Date.now()}`, label: "Generated", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() }];
      setShops((p) => [...p, { id: `shop-${Date.now()}`, name: "Untitled listing", slug: `listing-${code}`, google_review_url: "" }]);
      setQrs((p) => [...p, ...local]);
      setOpenId(local[0].id);
      setMode("edit");
      setBusy(null);
      return;
    }
    try {
      const supabase = createClient();
      const shopPayload = {
        name: "Untitled listing",
        slug: `listing-${code.toLowerCase()}`,
        ...PLACEHOLDER_FALLBACK,
      };
      // some columns reject db-level NULLs — the fallback values above keep the
      // insert valid; the editor overwrites them on the first real save
      let newShop, shErr;
      ({ data: newShop, error: shErr } = await supabase.from("shops").insert(shopPayload).select("*").single());
      if (shErr) setErr(shErr.message);
      const { data, error } = await supabase.from("qr_codes").insert({ code, label: "Generated", type: "qr", shop_id: newShop.id }).select("*").single();
      if (error) setErr(error.message);
      else {
        setShops((p) => [...p, newShop]);
        setQrs((p) => [...p, data]);
        setOpenId(data.id);
        setMode("edit");
        if (!demo) router.refresh();
      }
    } catch (e3) {
      setErr(String(e3?.message || e3));
    }
    setBusy(null);
  }

  const nfcUrl = openQr ? qrLinkUrl(openQr) : "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-textPrimary">QR Cards{demo && <span className="ml-2 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">DEMO</span>}</h1>
          <p className="mt-1 text-sm text-textSecondary">Each row is one physical card. Tap the QR number to see its card; tap Edit to set up the shop. Generate a unique QR, set it up, then print — the destination can change any time without reprinting. Scans count unique devices per shop.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateOne}
            disabled={busy === "new"}
            className="rounded-full bg-googleBlue px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3367D6] disabled:opacity-50"
          >
            {busy === "new" ? "Generating..." : "+ Generate QR code"}
          </button>
        </div>
      </div>

      {err && <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-googleRed">{err}</p>}
      {demo && <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Demo mode — new QRs are local only. Connect Supabase to persist.</p>}

      <div className="mt-5 overflow-hidden rounded-card border border-cardBorder bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cardBorder bg-surface text-xs font-semibold text-textSecondary">
              <tr>
                <th className="px-4 py-3">QR</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3 text-center">Scans</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardBorder">
              {numbered.map((q) => {
                const shop = shops.find((s) => s.id === q.shop_id);
                const notSetUp = shop && !shop.google_review_url;
                const row = ["px-4 py-3 whitespace-nowrap", q.is_active ? "" : "opacity-50"].join(" ");
                return (
                  <tr key={q.id} className="hover:bg-surface/50">
                    <td className={row}>
                      <button onClick={() => { setOpenId(q.id); setMode("card"); }} className="text-left group" title="Show this card">
                        <span className="block font-bold text-textPrimary group-hover:text-googleBlue">QR{q.qrNum}</span>
                        <span className="block font-mono text-[11px] text-textSecondary">{q.code}</span>
                      </button>
                    </td>
                    <td className={`${row} max-w-[240px]`}>
                      {notSetUp ? (
                        <button onClick={() => { setOpenId(q.id); setMode("edit"); }} className="text-left">
                          <span className="block font-semibold text-textSecondary">Not set up yet</span>
                          <span className="block text-xs text-textSecondary/80 hover:text-googleBlue">{qrLinkUrl(q).replace(/^https?:\/\//, "")} — tap Edit</span>
                        </button>
                      ) : shop ? (
                        <a href={qrLinkUrl(q)} target="_blank" rel="noopener noreferrer" title="Open review page in a new tab">
                          <span className="block font-semibold text-textPrimary hover:text-googleBlue truncate">{shop.name}</span>
                          <span className="block text-xs text-textSecondary truncate">{qrLinkUrl(q).replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        <button onClick={() => { setOpenId(q.id); setMode("edit"); }} className="text-left text-xs text-textSecondary hover:text-textPrimary">
                          — no listing · tap Edit
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-googleBlue/10 border border-googleBlue/20 px-2.5 py-1 text-xs font-bold text-googleBlue">
                        <span className="material-symbols-rounded" style={{ fontSize: 12 }}>visibility</span>
                        {q.scans_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {notSetUp ? (
                        <span className="inline-flex rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 text-xs font-semibold">Setup needed</span>
                      ) : (
                        <span className={["inline-flex rounded-full px-2 py-1 text-xs font-semibold", q.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"].join(" ")}>
                          {q.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setOpenId(q.id); setMode("edit"); }}
                        className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-surface"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {numbered.length === 0 && <p className="py-10 text-center text-sm text-textSecondary">No QR cards yet. Use “+ Generate QR code” above.</p>}
      </div>

      <p className="mt-4 text-xs text-textSecondary/70">
        Every card prints with its own QR: <b>/r/QR1</b> on card QR1, <b>/r/QR2</b> on card QR2, and so on — print first, set up the shop later, and change the destination any time without reprinting. Old-style links remain valid forever.
      </p>

      {/* ---------- Fullscreen: CARD view (QR number click) ---------- */}
      {openQr && mode === "card" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface" style={{ animation: "fadeUp 200ms ease-out" }}>
          <div className="sticky top-0 z-10 border-b border-cardBorder bg-white/95 backdrop-blur px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setOpenId(null)} className="inline-flex items-center gap-1.5 rounded-full border border-cardBorder bg-white px-3.5 py-2 text-xs font-bold text-textPrimary hover:bg-surface" title="Back to dashboard">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_back</span>
                  Back
                </button>
                <div>
                  <p className="text-lg font-bold tracking-tight text-textPrimary">
                    QR{openQr.qrNum} <span className="ml-1 font-mono text-sm font-semibold text-textSecondary">{openQr.code}</span>
                  </p>
                  <p className="text-xs text-textSecondary">
                    {openQr.label || "—"} · {openQr.type.toUpperCase()} · {openQr.scans_count || 0} scans{openShop ? ` · ${openShop.name}` : ""}
                    {openShop?.owner_name ? ` · Owner: ${openShop.owner_name}${openShop?.owner_phone ? ` · ${openShop.owner_phone}` : ""}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-full border border-cardBorder bg-white px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-surface">
                Back to dashboard
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-md rounded-card border border-cardBorder bg-white p-5">
              <img
                src={`/api/card/image?qr=${openQr.qrNum}&size=640`}
                alt={`QR${openQr.qrNum} printed card`}
                width={640}
                height={640}
                className="w-full rounded-xl border border-cardBorder bg-white shadow-sm"
              />
              <a
                href={`/api/card/image?qr=${openQr.qrNum}&size=1254`}
                download={`QR${openQr.qrNum}-card.png`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-textPrimary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
                Download card (for vendor)
              </a>
              <a
                href={`/api/qr/image?url=${encodeURIComponent(nfcUrl)}&size=1024`}
                download={`QR${openQr.qrNum}-qr-only.png`}
                className="mt-2 block text-center text-[11px] font-semibold text-googleBlue hover:underline"
              >
                QR code only (PNG)
              </a>

              <div className="mt-4 rounded-xl border border-googleBlue/30 bg-white p-3">
                <p className="text-[11px] font-bold text-googleBlue">NFC chip &amp; QR link — copy this URL onto the NFC chip placed at the shop</p>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={nfcUrl}
                    onFocus={(e) => e.target.select()}
                    className="w-full min-w-0 rounded-xl border border-cardBorder bg-surface px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none"
                  />
                  <button
                    onClick={() => copyText(nfcUrl, `nfc-${openQr.id}`)}
                    className="shrink-0 rounded-xl bg-googleBlue px-4 py-2 text-xs font-bold text-white hover:bg-[#3367D6]"
                  >
                    {copied === `nfc-${openQr.id}` ? "Copied!" : "Copy URL"}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-textSecondary">This URL never changes — changing the shop or its Google link later does not require reprinting.</p>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleActive(openQr)}
                  disabled={busy === openQr.id}
                  className="flex-1 rounded-full border border-cardBorder bg-white px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-surface"
                >
                  {openQr.is_active ? "Deactivate card" : "Activate card"}
                </button>
                <a
                  href={`/r/${openQr.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-full border border-cardBorder bg-white px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-surface text-center"
                >
                  Open page ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Fullscreen: EDIT view (Edit button / setup flow) ---------- */}
      {openQr && mode === "edit" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface" style={{ animation: "fadeUp 200ms ease-out" }}>
          <div className="sticky top-0 z-10 border-b border-cardBorder bg-white/95 backdrop-blur px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setOpenId(null)} className="inline-flex items-center gap-1.5 rounded-full border border-cardBorder bg-white px-3.5 py-2 text-xs font-bold text-textPrimary hover:bg-surface" title="Back to dashboard">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_back</span>
                  Back
                </button>
                <div>
                  <p className="text-lg font-bold tracking-tight text-textPrimary">
                    Edit QR{openQr.qrNum} <span className="ml-1 font-mono text-sm font-semibold text-textSecondary">{openQr.code}</span>
                  </p>
                  <p className="text-xs text-textSecondary">
                    Set up the shop for this card{isUntouched ? " — fill the details, then Save" : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-full border border-cardBorder bg-white px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-surface">
                Back to dashboard
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="rounded-card border border-cardBorder bg-white p-5 sm:p-6">
              {openShop ? (
                <ShopForm shop={openShop} embedded onSaved={handleSaved} />
              ) : (
                <p className="text-xs text-textSecondary">This card has no listing yet — save the editor or generate a new card.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <Toast message={savedMsg} />
    </div>
  );
}
