import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart/CartContext";
import { OrganizationJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: {
    default: "FAIN STORE — Marketplace Akun Game & Top Up Terpercaya",
    template: "%s | FAIN STORE",
  },
  description:
    "Belanja akun game dan top up dengan proses cepat, pembayaran otomatis, dan sistem transaksi yang aman.",
  openGraph: {
    title: "FAIN STORE",
    description: "Marketplace Akun Game & Top Up Terpercaya",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAIN STORE",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-background text-white antialiased">
        <OrganizationJsonLd />
        <CartProvider>
          <main className="min-h-[60vh]">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
