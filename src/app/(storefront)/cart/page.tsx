"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatIdr } from "@/lib/money";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-gray-400">Keranjang belanja Anda kosong.</p>
        <Link href="/produk" className="mt-4 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Keranjang Belanja</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 rounded-xl2 border border-border bg-background-secondary/60 p-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="text-sm font-medium">{item.name}</h3>
                <p className="text-sm text-gray-400">{formatIdr(item.priceIdr)}</p>
              </div>

              <div className="flex items-center justify-between">
                {item.isUniqueAccount ? (
                  <span className="text-xs text-gray-500">Qty: 1 (akun unik)</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="rounded-md border border-border p-1 hover:bg-white/5"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="rounded-md border border-border p-1 hover:bg-white/5"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => removeItem(item.productId)}
                  aria-label="Hapus"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl2 border border-border bg-background-secondary/60 p-4">
        <div className="flex justify-between text-sm text-gray-300">
          <span>Subtotal</span>
          <span>{formatIdr(subtotal)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 block rounded-lg bg-gradient-brand py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
        >
          Lanjut ke Checkout
        </Link>
      </div>
    </div>
  );
}
