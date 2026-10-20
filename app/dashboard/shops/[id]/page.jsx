import { notFound } from "next/navigation";
import Link from "next/link";
import { isDemoMode, getDemoShopById, getDemoQrs } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import ShopForm from "@/components/ShopForm";

export default async function EditShopPage({ params }) {
  const { id } = await params;
  let shop;
  let qrs = [];
  if (isDemoMode()) {
    shop = getDemoShopById(id);
    if (!shop) return notFound();
    qrs = getDemoQrs().filter((q) => q.shop_id === shop.id);
    return (
      <div>
        <Link href="/dashboard/shops" className="text-xs font-medium text-textSecondary hover:text-textPrimary">
          ← Back to shops
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-textPrimary">
          {shop.name} <span className="ml-2 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">DEMO</span>
        </h1>
        <p className="mt-1 text-sm text-textSecondary">Demo — edits are local only. Connect Supabase to persist.</p>
        <div className="mt-6 rounded-card border border-cardBorder bg-white p-6 opacity-60 pointer-events-none">
          <ShopForm shop={shop} />
        </div>
        <div className="mt-6 rounded-card border border-cardBorder bg-white p-5">
          <h2 className="text-sm font-bold text-textPrimary">Linked QR codes</h2>
          <ul className="mt-3 divide-y divide-cardBorder rounded-xl border border-cardBorder overflow-hidden">
            {qrs.map((q) => (
              <li key={q.id} className="flex items-center justify-between bg-white px-4 py-3 text-sm">
                <span className="font-mono text-xs font-bold text-textPrimary">{q.code}</span>
                <span className="text-xs text-textSecondary">
                  {q.label || "-"} · {q.type.toUpperCase()} · {q.scans_count} scans
                </span>
              </li>
            ))}
          </ul>
          {qrs.length === 0 && <p className="mt-2 text-sm text-textSecondary">No QR linked.</p>}
        </div>
      </div>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").eq("id", id).single();
  shop = data;
  if (!shop) return notFound();
  const { data: qrRows } = await supabase.from("qr_codes").select("id, code, label, type, scans_count, is_active").eq("shop_id", shop.id).order("created_at");
  qrs = qrRows || [];
  return (
    <div>
      <Link href="/dashboard/shops" className="text-xs font-medium text-textSecondary hover:text-textPrimary">
        ← Back to shops
      </Link>
      <h1 className="mt-2 text-xl font-bold tracking-tight text-textPrimary">Edit · {shop.name}</h1>
      <p className="mt-1 text-sm text-textSecondary">Redirect URL controls every linked QR. Change it here — no reprint.</p>
      <div className="mt-6 rounded-card border border-cardBorder bg-white p-6">
        <ShopForm shop={shop} />
      </div>
      <div className="mt-6 rounded-card border border-cardBorder bg-white p-5">
        <h2 className="text-sm font-bold text-textPrimary">Linked QR codes</h2>
        {!qrs || qrs.length === 0 ? (
          <p className="mt-2 text-sm text-textSecondary">
            No QR linked. Go to{" "}
            <Link href="/dashboard/qr" className="font-semibold text-googleBlue hover:underline">
              QR Pool
            </Link>{" "}
            and assign one.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-cardBorder rounded-xl border border-cardBorder overflow-hidden">
            {qrs.map((q) => (
              <li key={q.id} className="flex items-center justify-between bg-white px-4 py-3 text-sm">
                <span className="font-mono text-xs font-bold text-textPrimary">{q.code}</span>
                <span className="text-xs text-textSecondary">
                  {q.label || "-"} · {q.type.toUpperCase()} · {q.scans_count} scans
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
