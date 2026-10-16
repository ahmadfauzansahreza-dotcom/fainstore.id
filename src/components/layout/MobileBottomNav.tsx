"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ReceiptText,
  Headphones,
  UserRound,
} from "lucide-react";

const TABS = [
  {
    href: "/",
    label: "Beranda",
    icon: Home,
  },
  {
    href: "/produk",
    label: "Produk",
    icon: Package,
  },
  {
    href: "/akun/invoices",
    label: "Transaksi",
    icon: ReceiptText,
  },
  {
    href: "/contact",
    label: "Bantuan",
    icon: Headphones,
  },
  {
    href: "/akun",
    label: "Akun",
    icon: UserRound,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fain-glass-bottom-nav 
        fixed inset-x-0 bottom-0 z-[60]
        border-t border-white/[0.10]
        bg-[#070707]
        shadow-[0_-10px_35px_rgba(0,0,0,0.45)]
        md:hidden"
    >
      <div
        className="
          mx-auto flex
          h-[72px]
          w-full max-w-md
          items-stretch
          px-1
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`
                relative flex min-w-0 flex-1
                flex-col items-center justify-center
                gap-1
                px-1
                text-[10px]
                font-medium
                transition-all duration-200
                ${
                  active
                    ? "text-[#d6a84a]"
                    : "text-white/55 hover:text-white/85"
                }
              `}
            >
              <span
                className={`
                  flex h-8 w-8
                  items-center justify-center
                  rounded-xl
                  transition-all duration-200
                  ${
                    active
                      ? "bg-[#d6a84a]/10"
                      : "bg-transparent"
                  }
                `}
              >
                <Icon
                  className="h-[21px] w-[21px]"
                  strokeWidth={active ? 2.3 : 1.8}
                />
              </span>

              <span className="truncate leading-none">
                {label}
              </span>

              {active && (
                <span
                  className="
                    absolute
                    bottom-0
                    h-[2px]
                    w-9
                    rounded-full
                    bg-[#d6a84a]
                    shadow-[0_0_12px_rgba(214,168,74,0.6)]
                  "
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
