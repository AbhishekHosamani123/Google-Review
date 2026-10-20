import Link from "next/link";
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-cardBorder bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard/shops" className="text-sm font-bold tracking-tight text-textPrimary flex items-center gap-2">
            <img src="/radhakrishna-logo.png" alt="Radha Krishna logo" className="inline-block h-7 w-7 rounded-lg border border-cardBorder bg-white object-contain" /> ReviewHub
            <span className="hidden sm:inline text-xs font-medium text-textSecondary">· Admin</span>
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="rounded-full border border-cardBorder bg-white px-4 py-1.5 text-xs font-semibold text-textPrimary hover:bg-surface">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
