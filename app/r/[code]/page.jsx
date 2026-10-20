import ReviewPage from "@/components/ReviewPage";

export const dynamic = "force-dynamic";

export default async function RPage({ params }) {
  const { code } = await params;
  return <ReviewPage qrref={code} shopref={null} />;
}
