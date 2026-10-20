import { isDemoMode, getDemoShops, getDemoQrs } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import ShopsQrClient from "@/components/ShopsQrClient";

export default async function ShopsPage() {
  if (isDemoMode()) {
    return <ShopsQrClient shops={getDemoShops()} qrs={getDemoQrs()} demo />;
  }
  const supabase = await createClient();
  const [{ data: shops }, { data: qrs }] = await Promise.all([
    supabase.from("shops").select("*").order("created_at", { ascending: false }),
    supabase.from("qr_codes").select("*").order("created_at", { ascending: true }),
  ]);
  return <ShopsQrClient shops={shops || []} qrs={qrs || []} demo={false} />;
}
