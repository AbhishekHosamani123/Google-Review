"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { newCode, qrUrl } from "@/lib/qr";

function QrPreview({ url, size = 96 }) {
  const src = `/api/qr/image?url=${encodeURIComponent(url)}&size=${size}`;
  return <img src={src} alt="QR" width={size} height={size} className="rounded-xl border border-cardBorder bg-white" loading="lazy" />;
}

export default function QrPoolClient({ initialQrs, shops, demo }) {
  const [qrs, setQrs] = useState(initialQrs);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = qrs.filter((q) => {
    if (filter === "assigned") return !!q.shop_id;
    if (filter === "unassigned") return !q.shop_id;
    return true;
  });

  async function assign(qrId, shopId) {
    if (demo) {
      setQrs((prev) => prev.map((q) => (q.id === qrId ? { ...q, shop_id: shopId || null } : q)));
      return;
    }
    setBusy(qrId);
    const supabase = createClient();
    const { error } = await supabase.from("qr_codes").update({ shop_id: shopId || null }).eq("id", qrId);
    if (!error) setQrs((prev) => prev.map((q) => (q.id === qrId ? { ...q, shop_id: shopId || null } : q)));
    else alert(error.message);
    setBusy(null);
  }

  async function toggleActive(qr) {
    if (demo) {
      setQrs((p) => p.map((x) => (x.id === qr.id ? { ...x, is_active: !x.is_active } : x)));
      return;
    }
    setBusy(qr.id);
    const supabase = createClient();
    const { error } = await supabase.from("qr_codes").update({ is_active: !qr.is_active }).eq("id", qr.id);
    if (!error) setQrs((p) => p.map((x) => (x.id === qr.id ? { ...x, is_active: !x.is_active } : x)));
    else alert(error.message);
    setBusy(null);
  }

  async function generateOne() {
    if (demo) {
      const code = newCode();
      setQrs((p) => [...p, { id: `qr-${Date.now()}`, code, shop_id: null, label: "Generated", type: "qr", scans_count: 0, is_active: true, created_at: new Date().toISOString() }]);
      return;
    }
    setBusy("new");
    const code = newCode();
    const supabase = createClient();
    const { data, error } = await supabase.from("qr_codes").insert({ code, label: "Generated", type: "qr" }).select("*").single();
    if (error) alert(error.message);
    else setQrs((p) => [...p, data]);
    setBusy(null);
  }

  function copyLink(code) {
    const url = qrUrl(code);
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-cardBorder bg-white p-1 text-xs font-semibold">
          {[
            ["all", `All (${qrs.length})`],
            ["unassigned", `Unassigned (${qrs.filter((q) => !q.shop_id).length})`],
            ["assigned", `Assigned (${qrs.filter((q) => q.shop_id).length})`],
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
        <button
          onClick={generateOne}
          disabled={busy === "new"}
          className="ml-auto rounded-full bg-googleBlue px-4 py-2 text-xs font-bold text-white hover:bg-[#3367D6] disabled:opacity-50"
        >
          + Generate new QR
        </button>
      </div>

      {demo && <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Demo: assigns and new QRs are local only — Supabase will persist when you connect it.</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((q) => {
          const shop = shops.find((s) => s.id === q.shop_id);
          const url = qrUrl(q.code);
          const pretty = url.replace(/^https?:\/\//, "");
          return (
            <div
              key={q.id}
              className={["rounded-card border bg-white p-4", q.is_active ? "border-cardBorder" : "border-zinc-300 opacity-60"].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest text-textPrimary">{q.code}</p>
                  <p className="text-xs text-textSecondary">
                    {q.label || "-"} · {q.type.toUpperCase()} · {q.scans_count} scans
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-textSecondary break-all">{pretty}</p>
                </div>
                <QrPreview url={url} size={96} />
              </div>

              <label className="mt-3 block">
                <span className="text-[11px] font-semibold text-textSecondary">Redirect to shop</span>
                <select
                  value={q.shop_id || ""}
                  onChange={(e) => assign(q.id, e.target.value || null)}
                  disabled={busy === q.id}
                  className="mt-1 w-full rounded-xl border border-cardBorder bg-white px-2.5 py-2 text-sm focus:border-googleBlue focus:outline-none"
                >
                  <option value="">- Unassigned (no destination)</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.slug}
                    </option>
                  ))}
                </select>
              </label>
              {shop && (
                <p className="mt-1 text-[11px] text-textSecondary">
                  Will resolve to Google URL of <b className="text-textPrimary">{shop.name}</b> - change there to move this QR.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => copyLink(q.code)}
                  className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-surface"
                >
                  {copied === q.code ? "Copied!" : "Copy link"}
                </button>
                <a
                  href={`/api/qr/image?url=${encodeURIComponent(url)}&size=1024`}
                  download={`qr-${q.code}.png`}
                  className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-surface"
                >
                  Download PNG
                </a>
                <button
                  onClick={() => toggleActive(q)}
                  disabled={busy === q.id}
                  className="rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-surface"
                >
                  {q.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="mt-8 text-center text-sm text-textSecondary">No QR in this filter.</p>}
      <p className="mt-6 text-xs text-textSecondary/70">
        NFC: write <code className="rounded bg-white border border-cardBorder px-1">/r/&lt;code&gt;</code> URI on NTAG213 · Print ≥2×2 cm, H-correction, logo ≤22% · All QRs remain valid after you add a custom domain.
      </p>
    </div>
  );
}
