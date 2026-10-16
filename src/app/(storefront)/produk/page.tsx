"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCardWithWishlist } from "@/components/product/ProductCardWithWishlist";
import { Search } from "lucide-react";

interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  priceIdr: number;
  originalPriceIdr: number | null;
  discountPct: number | null;
  stockQty: number;
  type: "GAME_ACCOUNT" | "TOPUP";
  soldCount: number;
  images: { url: string }[];
  game: {
    name: string;
    slug: string;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "cheapest", label: "Termurah" },
  { value: "expensive", label: "Termahal" },
  { value: "bestselling", label: "Terlaris" },
];

export default function ProductListingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams(searchParams.toString());

      const res = await fetch(`/api/products?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Gagal mengambil produk");
      }

      const data = await res.json();

      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }

      // Kembali ke halaman pertama ketika pencarian berubah
      params.delete("page");

      router.replace(`/produk?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput, searchParams, router]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Ketika filter/sort berubah, kembali ke halaman pertama
    params.delete("page");

    router.push(`/produk?${params.toString()}`);
  }

  function changePage(page: number) {
    if (!pagination) return;

    if (page < 1 || page > pagination.totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    router.push(`/produk?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">

      {/* SEARCH & SORT */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari produk, game, atau kategori..."
            className="w-full rounded-lg border border-border bg-background-secondary py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-accent-blue focus:outline-none"
          />
        </div>

        <select
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

      </div>

      {/* PRODUCT CONTENT */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl bg-background-secondary"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border py-20 text-center">
          <p className="text-gray-400">
            Produk tidak ditemukan.
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Coba ubah kata kunci atau filter pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((p) => (
            <ProductCardWithWishlist
              key={p.id}
              productId={p.id}
              slug={p.slug}
              name={p.name}
              imageUrl={p.images?.[0]?.url ?? "/placeholder-product.jpg"}
              gameName={p.game?.name}
              priceIdr={p.priceIdr}
              originalPriceIdr={p.originalPriceIdr}
              discountPct={p.discountPct}
              inStock={
                p.type === "GAME_ACCOUNT" ||
                p.stockQty > 0
              }
              soldCount={p.soldCount}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="mt-10 flex flex-col items-center gap-4">

          <div className="text-sm text-gray-500">
            Menampilkan halaman {pagination.page} dari{" "}
            {pagination.totalPages}
            {" • "}
            {pagination.total} produk
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-white transition hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Sebelumnya
            </button>

            <div className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-white">
              {pagination.page}
            </div>

            <button
              type="button"
              onClick={() => changePage(pagination.page + 1)}
              disabled={
                pagination.page >= pagination.totalPages
              }
              className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-white transition hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya →
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
