"use client";

import Link from "next/link";
import { Heart, Eye, Gamepad2, Tag } from "lucide-react";
import { formatIdr } from "@/lib/money";

export interface ProductCardProps {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  gameName: string;
  priceIdr: number;
  originalPriceIdr?: number | null;
  discountPct?: number | null;
  inStock: boolean;
  soldCount: number;
  rating?: number | null;
  isFavorited?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

export function ProductCard({
  productId,
  slug,
  name,
  imageUrl,
  gameName,
  priceIdr,
  originalPriceIdr,
  discountPct,
  inStock,
  soldCount,
  rating,
  isFavorited = false,
  onToggleFavorite,
}: ProductCardProps) {
  const hasDiscount =
    !!originalPriceIdr &&
    originalPriceIdr > priceIdr;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0d] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-blue-500/10">
      {/* IMAGE */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[#15151a] via-[#0d0d10] to-[#050507]">
        {imageUrl && !imageUrl.includes("placeholder") ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/10">
              <Gamepad2 className="h-8 w-8 text-blue-400" />
            </div>

            <span className="mt-3 text-xs font-medium text-gray-400">
              {gameName}
            </span>
          </div>
        )}

        {/* DISCOUNT */}
        {discountPct && discountPct > 0 ? (
          <span className="absolute left-2 top-2 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
            -{discountPct}%
          </span>
        ) : null}

        {/* WISHLIST */}
        <button
          type="button"
          onClick={() => onToggleFavorite?.(productId)}
          aria-label={
            isFavorited
              ? "Hapus dari wishlist"
              : "Tambah ke wishlist"
          }
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md transition hover:bg-black/80"
        >
          <Heart
            className={`h-4 w-4 transition ${
              isFavorited
                ? "fill-blue-500 text-blue-500"
                : "text-white"
            }`}
          />
        </button>

        {/* DETAIL */}
        <Link
          href={`/produk/${slug}`}
          className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-xl bg-black/70 py-2 text-xs font-semibold text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100"
        >
          <Eye className="h-3.5 w-3.5" />
          Lihat Detail
        </Link>
      </div>

      {/* CONTENT */}
      <div className="p-3">
        {/* GAME */}
        <div className="mb-1 flex items-center gap-1.5">
          <Gamepad2 className="h-3.5 w-3.5 text-blue-400" />

          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-blue-400">
            {gameName}
          </span>
        </div>

        {/* NAME */}
        <Link href={`/produk/${slug}`}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-white transition hover:text-blue-400">
            {name}
          </h3>
        </Link>

        {/* PRICE */}
        <div className="mt-2">
          <div className="flex items-end gap-2">
            <span className="text-base font-bold text-white">
              {formatIdr(priceIdr)}
            </span>

            {hasDiscount ? (
              <span className="text-[10px] text-gray-500 line-through">
                {formatIdr(originalPriceIdr!)}
              </span>
            ) : null}
          </div>
        </div>{/* BUTTON */}
<Link
  href={`/produk/${slug}`}
  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
    inStock
      ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]"
      : "cursor-not-allowed bg-white/5 text-gray-500"
  }`}
  aria-disabled={!inStock}
  onClick={(e) => {
    if (!inStock) e.preventDefault();
  }}
>
  {inStock ? "Beli Sekarang" : "Beli Sekarang"}
</Link>

{/* RATING */}
        {rating !== null && rating !== undefined ? (
          <div className="mt-2 text-center text-[10px] text-gray-500">
            ★ {rating.toFixed(1)} · Produk terpercaya
          </div>
        ) : null}
      </div>
    </div>
  );
}
