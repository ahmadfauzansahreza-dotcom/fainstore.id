import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClipboardList, Heart, FileText, Bell, ShieldCheck, LogOut } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id!;
  const user = await db.user.findUnique({ where: { id: userId } });
  const orderCount = await db.order.count({ where: { userId } });
  const wishlistCount = await db.wishlist.count({ where: { userId } });

  const menu = [
    { href: "/akun/orders", label: "Pesanan Saya", icon: ClipboardList, count: orderCount },
    { href: "/akun/wishlist", label: "Wishlist", icon: Heart, count: wishlistCount },
    { href: "/akun/invoices", label: "Invoice", icon: FileText },
    { href: "/akun/notifications", label: "Notifikasi", icon: Bell },
    { href: "/akun/security", label: "Keamanan Akun", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4 rounded-xl2 border border-border bg-background-secondary/60 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-lg font-bold text-white">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.name ?? "Pengguna"}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        {menu.map(({ href, label, icon: Icon, count }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl2 border border-border bg-background-secondary/60 px-4 py-3 hover:border-accent-blue/40"
          >
            <span className="flex items-center gap-3 text-sm text-white">
              <Icon className="h-4 w-4 text-accent-blue" /> {label}
            </span>
            {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
          </Link>
        ))}

        <SignOutButton />
      </div>
    </div>
  );
}
