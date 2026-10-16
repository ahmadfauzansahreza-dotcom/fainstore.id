"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";
import { formatIdr } from "@/lib/money";

export default function CheckoutPage() {
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const searchParams = useSearchParams();

  const topupProductId = searchParams.get("productId") || "";
  const topupGameUid = searchParams.get("gameUid") || "";
  const topupServerId = searchParams.get("serverId") || "";
  const topupQuantity = Math.max(
    1,
    Number(searchParams.get("quantity") || "1")
  );
  const paymentMethod = searchParams.get("paymentMethod") || "QRIS";
  const isTopUpCheckout = Boolean(topupProductId && topupGameUid);

  const items = isTopUpCheckout
    ? [{
        productId: topupProductId,
        quantity: topupQuantity,
        gameUid: topupGameUid,
        serverId: topupServerId,
        name: "Top Up",
        priceId: 0,
      }]
    : cartItems;

  const subtotal = isTopUpCheckout ? 0 : cartSubtotal;
  const router = useRouter();

  

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          notes: form.notes,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: couponCode || undefined,
          paymentMethod,
          topUp: isTopUpCheckout
            ? {
                productId: topupProductId,
                gameUid: topupGameUid,
                serverId: topupServerId || undefined,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan saat membuat pesanan. Silakan coba kembali.");
        setSubmitting(false);
        return;
      }

      clearCart();
      const paymentUrl =
        data.paymentUrl ||
        data.checkoutUrl ||
        data.paymentReference;

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      router.push(`/order/${data.orderId}`);
      setSubmitting(false);
    } catch {
      setError("Terjadi kesalahan saat membuat pembayaran. Silakan coba kembali.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <p className="mx-auto max-w-2xl px-4 py-24 text-center text-gray-400">Keranjang Anda kosong.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Nama Lengkap</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Nomor WhatsApp</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Catatan (opsional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Kode Kupon (opsional)</label>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="rounded-xl2 border border-border bg-background-secondary/60 p-4">
            <h3 className="mb-3 text-sm font-semibold">Ringkasan Pesanan</h3>
            <div className="space-y-1.5 text-sm text-gray-300">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between">
                  <span className="line-clamp-1">{(i as any).name ?? i.productId} × {i.quantity}</span>
                  <span>{formatIdr(((i as any).priceId ?? 0) * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Subtotal</span>
              <span>{formatIdr(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">Diskon kupon dan total final dihitung ulang oleh server.</p>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-gradient-brand py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
