"use client";
import Link from "next/link";

export default function DashboardClient({ shops, qrs, totalScans, byShop = {} }) {
  const totalShops = shops.length;
  const totalQr = qrs.length;
  const assigned = qrs.filter((q) => q.shop_id).length;
  const top = [...shops].map((s) => ({ ...s, scans: byShop[s.id] || 0 })).sort((a, b) => b.scans - a.scans);
  return (
    <div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 mb-4">Demo mode — data is local, resets on refresh. Connect Supabase to persist.</div>
      <h1 className="text-xl font-bold tracking-tight text-textPrimary">
        Overview <span className="ml-2 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">DEMO</span>
      </h1>
      <p className="mt-1 text-sm text-textSecondary">Total users = QR/NFC scans — per-shop breakdown below.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Shops", totalShops, "storefront"],
          ["QR codes", totalQr, "qr_code_2"],
          ["Total scans", totalScans, "visibility"],
          ["Assigned", assigned, "link"],
        ].map(([label, val, icon]) => (
          <div key={label} className="rounded-card border border-cardBorder bg-white p-4">
            <p className="text-xs font-semibold text-textSecondary flex items-center gap-1.5">
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {icon}
              </span>
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-textPrimary">{val}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-card border border-cardBorder bg-white p-4">
        <p className="text-sm font-bold text-textPrimary">Scans per shop — how many users used your card</p>
        <div className="mt-3 divide-y divide-cardBorder border border-cardBorder rounded-xl overflow-hidden">
          {top.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-white px-4 py-3">
              <span className="text-sm font-semibold text-textPrimary">
                {s.name} <span className="text-xs font-normal text-textSecondary">· {s.category}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-googleBlue/10 border border-googleBlue/20 px-2.5 py-1 text-xs font-bold text-googleBlue">
                {s.scans} scans
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-card border border-cardBorder bg-white p-5">
        <p className="text-sm font-bold text-textPrimary">Demo shops — try the customer page</p>
        <p className="mt-1 text-sm text-textSecondary">Opens without Supabase. Generates a category-aware review.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/r/demo-pink" className="rounded-full bg-googleBlue px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3367D6]">
            Pink Verranda → /r/demo-pink
          </Link>
          <Link href="/r/a1b2c3d4" className="rounded-full border border-cardBorder bg-white px-5 py-2.5 text-sm font-semibold text-textPrimary hover:bg-surface">
            /r/a1b2c3d4
          </Link>
          <Link href="/r/g3h4i5j6" className="rounded-full border border-cardBorder bg-white px-5 py-2.5 text-sm font-semibold text-textPrimary hover:bg-surface">
            Spice Street → /r/g3h4i5j6
          </Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-dashed border-cardBorder bg-white p-6 text-center">
          <p className="text-sm font-semibold text-textPrimary">Quick actions</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/dashboard/shops" className="rounded-full bg-googleBlue px-5 py-3 text-sm font-bold text-white hover:bg-[#3367D6]">
              Shops
            </Link>
            <Link href="/dashboard/qr" className="rounded-full border border-cardBorder bg-white px-5 py-2.5 text-sm font-semibold text-textPrimary hover:bg-surface">
              QR Pool
            </Link>
          </div>
        </div>
        <div className="rounded-card border border-cardBorder bg-white p-5">
          <p className="text-sm font-bold text-textPrimary">How tracking works</p>
          <p className="mt-2 text-sm leading-relaxed text-textSecondary">Each visit to /r/&lt;code&gt; increments that QR&apos;s scans_count and inserts into analytics_events. Dashboard sums per shop automatically.</p>
        </div>
      </div>
    </div>
  );
}
