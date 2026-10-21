import { notFound, redirect } from "next/navigation";
import ReviewClient from "@/components/ReviewClient";
import FastForward from "@/components/FastForward";
import { isDemoMode, getDemoQrByCode, getDemoQrs, getDemoShopById } from "@/lib/demo";
import { createAdminClient } from "@/lib/supabase/admin";
import { withQrNumbers, qrLinkUrl } from "@/lib/qr";

function NotLinked({ qrref }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-sm rounded-card border border-cardBorder bg-white p-6 text-center">
        <p className="text-sm font-bold text-textPrimary">Card not linked yet</p>
        <p className="mt-1 text-sm text-textSecondary">This card has not been assigned to a shop yet. The shop owner can link it from the dashboard any time — the printed QR never changes.</p>
        <p className="mt-2 font-mono text-xs text-textSecondary">{qrref}</p>
      </div>
    </div>
  );
}

// Resolves a scan:
//   /r/QR<n>            -> printed card n (permanent, shop resolved live)
//   /r/QR<n>/<anything> -> 301-style redirect to the canonical /r/QR<n>
//   /r/<code>           -> legacy direct code (still valid)
// The QR NUMBER is the permanent key — renaming or re-targeting a shop never
// breaks a printed card or NFC chip.
export default async function ReviewPage({ qrref, shopref }) {
  const demo = isDemoMode();
  let qr = null;

  // /r/Radha<n> (canonical) and legacy /r/QR<n> both resolve card n positionally;
  // literal codes (e.g. a hand-made link) resolve by exact code column match.
  let legacyQrLink = false;
  if (/^(Radha|QR)(\d+)$/i.test(qrref || "")) {
    const m = String(qrref).match(/^(Radha|QR)(\d+)$/i);
    legacyQrLink = /^qr$/i.test(m[1]);
    const n = parseInt(m[2], 10);
    if (Number.isFinite(n) && n >= 1) {
      if (demo) qr = withQrNumbers(getDemoQrs()).find((q) => q.qrNum === n) || null;
      else {
        const admin = createAdminClient();
        const { data: rows } = await admin.from("qr_codes").select("*").order("created_at", { ascending: true });
        qr = withQrNumbers(rows || []).find((q) => q.qrNum === n) || null;
      }
    }
    // canonical URL has no shop name — anything after /r/Radha<n>/ is dropped
    if (qr && (shopref || legacyQrLink)) redirect(qrLinkUrl(qr));
  } else if (qrref) {
    if (demo) qr = getDemoQrByCode(qrref) || null;
    else {
      const admin = createAdminClient();
      const { data: row } = await admin.from("qr_codes").select("*").eq("code", qrref).eq("is_active", true).single();
      qr = row || null;
    }
    if (qr && shopref) {
      if (demo) {
        const n = withQrNumbers(getDemoQrs()).findIndex((q) => q.id === qr.id) + 1;
        redirect(`/r/Radha${n}`);
      }
      const admin = createAdminClient();
      const { data: rows } = await admin.from("qr_codes").select("*").order("created_at", { ascending: true });
      const n = withQrNumbers(rows || []).findIndex((q) => q.id === qr.id) + 1;
      redirect(`/r/Radha${n}`);
    }
  }
  if (!qr) return notFound();
  if (!qr.shop_id) return <NotLinked qrref={qrref} />;

  let shop = null;
  if (demo) shop = getDemoShopById(qr.shop_id);
  else {
    const admin = createAdminClient();
    const { data } = await admin.from("shops").select("*").eq("id", qr.shop_id).single();
    shop = data;
  }
  if (!shop) return notFound();
  if (!shop.is_active) return notFound();

  if (!shop.ai_enabled) return <FastForward qr={qr} shop={shop} />;
  return <ReviewClient shop={shop} qr={qr} />;
}
