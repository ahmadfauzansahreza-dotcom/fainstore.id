import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Settings,
  KeyRound,
  ScrollText,
  Image as ImageIcon,
  MessageSquareQuote,
  Gamepad2,
  Store,
  ExternalLink,
} from "lucide-react";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/games", label: "Game & Kategori", icon: Gamepad2 },
  { href: "/admin/accounts", label: "Inventaris Akun", icon: KeyRound },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { href: "/admin/coupons", label: "Kupon", icon: Tag },
  { href: "/admin/banners", label: "Banner", icon: ImageIcon },
  { href: "/admin/testimonials", label: "Testimoni", icon: MessageSquareQuote },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#0d0d0d] lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-500">
              FAIN STORE
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
            Management
          </p>

          <nav className="space-y-1">
            {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Icon className="h-[18px] w-[18px] shrink-0 transition group-hover:scale-105" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-sm text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <Store className="h-4 w-4" />
            <span className="flex-1">Lihat Store</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090909]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs text-gray-500 lg:hidden">FAIN STORE</p>
              <p className="text-sm font-semibold">Admin Panel</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium text-white">
                  {(session.user as { name?: string }).name || "Administrator"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold">
                {(
                  (session.user as { name?: string }).name ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className="border-b border-white/10 bg-[#0d0d0d] lg:hidden">
          <div className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
            {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
