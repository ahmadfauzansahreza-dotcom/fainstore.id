"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart/CartContext";

export function AddToCartButton({ product, disabled }: { product: CartItem; disabled?: boolean }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ ...product, quantity: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    addItem({ ...product, quantity: 1 });
    router.push("/checkout");
  }

  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={handleAdd}
        disabled={disabled}
        className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {added ? "Ditambahkan ✓" : "Tambah ke Keranjang"}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={disabled}
        className="flex-1 rounded-lg bg-gradient-brand py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Beli Sekarang
      </button>
    </div>
  );
}
