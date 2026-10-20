import ShopForm from "@/components/ShopForm";
export default function NewShopPage() {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-textPrimary">New shop</h1>
      <p className="mt-1 text-sm text-textSecondary">Add Google review URL and optional PNG logo. You will assign a QR next.</p>
      <div className="mt-6 rounded-card border border-cardBorder bg-white p-6"><ShopForm /></div>
    </div>
  );
}
