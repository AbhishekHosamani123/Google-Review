"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function ShopsQrClient({ shops: initialShops, qrs: initialQrs, demo }) {
  const router = useRouter();
  const [shops, setShops] = useState(initialShops || []);
  const [qrs, setQrs] = useState(initialQrs || []);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(null);
  const [err, setErr] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // keep local state in sync when the server re-renders with fresh data
  useEffect(() => { setShops(initialShops || []); }, [initialShops]);
  useEffect(() => { setQrs(initialQrs || []); }, [initialQrs]);

  const numbered = withQrNumbers(qrs);
  const total = qrs.length;
  const filtered = numbered.filter((q) => {
    if (filter === "assigned") return !!q.shop_id;
    if (filter === "unassigned") return !q.shop_id;
    return true;
  });
  const openQr = numbered.find((q) => q.id === openId) || null;
  const openShop = openQr ? shops.find((s) => s.id === openQr.shop_id) : null;
  const noQrShops = shops.filter((s) => !qrs.some((q) => q.shop_id === s.id));

  function flashCopied(key) {
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function handleSaved() {
    setSavedMsg("Saved! The shop and every linked QR are up to date.");
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

  async function assign(qrId, shopId) {
    if (demo) {
      setQrs((prev) => prev.map((q) => (q.id === qrId ? { ...q, shop_id: shopId || null } : q)));
      return;
    }
    setBusy(qrId);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("qr_codes").update({ shop_id: shopId || null }).eq("id", qrId);
    if (error) setErr(error.message);
    else setQrs((prev) => prev.map((q) => (q.id === qrId ? { ...q, shop_id: shopId || null } : q)));
    setBusy(null);
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

  async function generateOne() {
    setBusy("new");
    setErr("");
    const code = newCode(8);
    if (demo) {
      setQrs((p) => [...p, { id: `qr-${Date.now()}`, code, shop_id: null, label: "Generated", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() }]);
      setBusy(null);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.from("qr_codes").insert({ code, label: "Generated", type: "qr" }).select("*").single();
    if (error) setErr(error.message);
    else setQrs((p) => [...p, data]);
    setBusy(null);
  }

  async function generateForShop(shopId) {
    setBusy(`shop-${shopId}`);
    setErr("");
    const code = newCode(8);
    if (demo) {
      setQrs((p) => [...p, { id: `qr-${Date.now()}`, code, shop_id: shopId, label: "Generated", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() }]);
      setBusy(null);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.from("qr_codes").insert({ code, label: "Generated", type: "qr", shop_id: shopId }).select("*").single();
    if (error) setErr(error.message);
    else setQrs((p) => [...p, data]);
    setBusy(null);
  }

  const nfcUrl = openQr ? qrLinkUrl(openQr) : "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-textPrimary">Shops{demo && <span className="ml-2 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">DEMO</span>}</h1>
          <p className="mt-1 text-sm text-textSecondary">Click a Shop name to open its review page in a new tab. Click a QR number or Edit to see the full printed card, copy the NFC URL, and download for the vendor. Scans count unique users (one per device per shop, remembered in the visitor&apos;s own browser).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/shops/new" className="rounded-full bg-textPrimary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
            + New shop
          </Link>
          <button
            onClick={generateOne}
            disabled={busy === "new"}
            className="rounded-full bg-googleBlue px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3367D6] disabled:opacity-50"
          >
            + Generate QR{busy === "new" ? "..." : ""}
          </button>
        </div>
      </div>

      {err && <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-googleRed">{err}</p>}
      {demo && <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Demo mode — assignments and new QRs are local only. Connect Supabase to persist.</p>}

      {noQrShops.length > 0 && (
        <div className="mt-4 rounded-card border border-dashed border-amber-300 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-800">Shops with no linked QR yet</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {noQrShops.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary">
                {s.name}
                <button
                  onClick={() => generateForShop(s.id)}
                  disabled={busy === `shop-${s.id}`}
                  className="rounded-full bg-googleBlue px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#3367D6] disabled:opacity-50"
                >
                  {busy === `shop-${s.id}` ? "..." : "+ QR"}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-cardBorder bg-white p-1 text-xs font-semibold">
          {[
            ["all", `All (${total})`],
            ["assigned", `Assigned (${qrs.filter((q) => q.shop_id).length})`],
            ["unassigned", `Unassigned (${qrs.filter((q) => !q.shop_id).length})`],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={["rounded-full px-3 py-1.5", filter === k ? "bg-textPrimary text-white" : "text-textSecondary hover:text-textPrimary"].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-cardBorder bg-white">
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
              {filtered.map((q) => {
                const shop = shops.find((s) => s.id === q.shop_id);
                const row = [
                  "px-4 py-3 whitespace-nowrap",
                  q.is_active ? "" : "opacity-50",
                ].join(" ");
                return (
                  <tr key={q.id} className="hover:bg-surface/50">
                    <td className={row}>
                      <button onClick={() => setOpenId(q.id)} className="text-left group">
                        <span className="block font-bold text-textPrimary group-hover:text-googleBlue">QR{q.qrNum}</span>
                        <span className="block font-mono text-[11px] text-textSecondary">{q.code}</span>
                      </button>
                    </td>
                    <td className={`${row} max-w-[220px]`}>
                      {shop ? (
                        <a href={qrLinkUrl(q)} target="_blank" rel="noopener noreferrer" title="Open review page in a new tab">
                          <span className="block font-semibold text-textPrimary hover:text-googleBlue truncate">{shop.name}</span>
                          <span className="block text-xs text-textSecondary truncate">{qrLinkUrl(q).replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        <button onClick={() => setOpenId(q.id)} className="text-left text-xs text-textSecondary hover:text-textPrimary">
                          — unassigned · {qrLinkUrl(q).replace(/^https?:\/\//, "")}
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
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                          q.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200",
                        ].join(" ")}
                      >
                        {q.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setOpenId(q.id)}
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
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-textSecondary">No QR cards in this filter. Use “+ Generate QR” above.</p>}
      </div>

      <p className="mt-4 text-xs text-textSecondary/70">
        Every card prints with its own QR: <b>/r/QR1</b> on card QR1, <b>/r/QR2</b> on card QR2, and so on — print first, link to a shop later, and change the shop any time without reprinting. Old-style links remain valid forever.
      </p>

      {/* ---------- Edit / detail modal ---------- */}
      {openQr && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenId(null)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-cardBorder bg-white p-6 shadow-raised"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeUp 200ms ease-out" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold tracking-tight text-textPrimary">
                  QR{openQr.qrNum} <span className="ml-1 font-mono text-sm font-semibold text-textSecondary">{openQr.code}</span>
                </p>
                <p className="text-xs text-textSecondary">
                  {openQr.label || "—"} · {openQr.type.toUpperCase()} · {openQr.scans_count || 0} scans
                </p>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textSecondary hover:bg-surface">
                Close ✕
              </button>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-[210px,1fr]">
              <div>
                <img
                  src={`/api/card/image?qr=${openQr.qrNum}&size=640`}
                  alt={`QR${openQr.qrNum} printed card`}
                  width={210}
                  height={210}
                  className="w-[210px] rounded-xl border border-cardBorder bg-white shadow-sm"
                />
                <a
                  href={`/api/card/image?qr=${openQr.qrNum}&size=1254`}
                  download={`QR${openQr.qrNum}-card.png`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-textPrimary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
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
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-googleBlue/30 bg-chipSelected p-3">
                  <p className="text-[11px] font-bold text-googleBlue">NFC chip & QR link — copy this URL onto the NFC chip placed at the shop</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      readOnly
                      value={nfcUrl}
                      onFocus={(e) => e.target.select()}
                      className="w-full rounded-xl border border-cardBorder bg-white px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none"
                    />
                    <button
                      onClick={() => copyText(nfcUrl, `nfc-${openQr.id}`)}
                      className="shrink-0 rounded-xl bg-googleBlue px-4 py-2 text-xs font-bold text-white hover:bg-[#3367D6]"
                    >
                      {copied === `nfc-${openQr.id}` ? "Copied!" : "Copy URL"}
                    </button>
                  </div>
                  {!openShop && (
                    <p className="mt-1.5 text-[11px] text-amber-700">
                      This card is not linked to a shop yet — assign one in the dropdown below. The printed QR and this URL never change, so you can print cards first and link shops later (even change shops any time).
                    </p>
                  )}
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-textPrimary">Redirects to shop</span>
                  <select
                    value={openQr.shop_id || ""}
                    onChange={(e) => assign(openQr.id, e.target.value || null)}
                    disabled={busy === openQr.id}
                    className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-3 py-2.5 text-sm focus:border-googleBlue focus:outline-none"
                  >
                    <option value="">— Unassigned (no destination)</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.slug}
                      </option>
                    ))}
                  </select>
                </label>

                {openShop && (
                  <div className="rounded-xl border border-cardBorder bg-surface p-3">
                    <p className="text-[11px] font-bold text-textPrimary">{openShop.name} — Google review URL</p>
                    <p className="mt-1 text-[11px] text-textSecondary">Full Google review URL, keywords, description and more are editable in the shop details section below.</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleActive(openQr)}
                    disabled={busy === openQr.id}
                    className="rounded-full border border-cardBorder bg-white px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-surface"
                  >
                    {openQr.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <a
                    href={`/r/${openQr.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-cardBorder bg-white px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-surface"
                  >
                    Open review page ↗
                  </a>
                </div>
              </div>
            </div>

            {/* ---------- Full shop editor ---------- */}
            <div className="mt-6 border-t border-cardBorder pt-5">
              <p className="text-sm font-bold text-textPrimary">
                Shop details {openShop ? <span className="text-textSecondary font-semibold">— {openShop.name}</span> : ""}
              </p>
              {openShop ? (
                demo ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    Demo mode — connect your Supabase project to edit shop details here. In the live app the full editor (name, description, category, keywords, Google URL, logo...) opens in this panel.
                  </div>
                ) : (
                  <div className="mt-3">
                    <ShopForm shop={openShop} embedded onSaved={handleSaved} />
                  </div>
                )
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-textSecondary">
                  Pick a shop in <b>“Redirects to shop”</b> above — its full details (name, description, category/shop type, keywords, Google review URL, logo...) appear here for editing. To create a brand-new shop, use <b>“+ New shop”</b> at the top of the page, then select it here.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <Toast message={savedMsg} />
    </div>
  );
}
