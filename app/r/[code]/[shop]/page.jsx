import ReviewPage from "@/components/ReviewPage";

export const dynamic = "force-dynamic";

export default async function RShopPage({ params }) {
  const { code, shop } = await params;
  return <ReviewPage qrref={code} shopref={shop || null} />;
}
