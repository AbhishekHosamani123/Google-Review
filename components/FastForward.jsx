"use client";
import { useEffect } from "react";
import { hasScanRecord, markScanRecord } from "@/lib/scanDedup";

// Shown when a shop has the AI helper OFF: counts the user's first visit to this
// shop (browser decides) and then hands off straight to the Google review URL.
export default function FastForward({ qr, shop }) {
  useEffect(() => {
    if (!hasScanRecord(shop.id)) {
      markScanRecord(shop.id);
      fetch("/api/track/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code_id: qr.id, shop_id: shop.id, event_type: "scan" }),
      }).catch(() => {});
    }
    window.location.replace(shop.google_review_url);
  }, [shop.id, qr.id, shop.google_review_url]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-sm rounded-card border border-cardBorder bg-white p-6 text-center">
        <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-googleBlue border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-textPrimary">Opening Google reviews…</p>
        {shop.name && <p className="mt-1 text-xs text-textSecondary">{shop.name}</p>}
      </div>
    </div>
  );
}
