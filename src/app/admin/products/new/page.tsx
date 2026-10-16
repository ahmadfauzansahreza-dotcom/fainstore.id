"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Game {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "GAME_ACCOUNT" as "GAME_ACCOUNT" | "TOPUP",
    gameId: "",
    categoryId: "",
    description: "",
    priceIdr: "",
    originalPriceIdr: "",
    stockQty: "0",
    warranty: "",
    imageUrl: "",
    isFeatured: false,
    isBestSeller: false,
    isFlashSale: false,
  });

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => setGames(data.items ?? []));
  }, []);

  const selectedGame = games.find((g) => g.id === form.gameId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        gameId: form.gameId,
        categoryId: form.categoryId || undefined,
        description: form.description || undefined,
        priceIdr: Number(form.priceIdr),
        originalPriceIdr: form.originalPriceIdr ? Number(form.originalPriceIdr) : undefined,
        stockQty: Number(form.stockQty),
        warranty: form.warranty || undefined,
        images: form.imageUrl ? [form.imageUrl] : [],
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isFlashSale: form.isFlashSale,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan produk.");
      setSubmitting(false);
      return;
    }
    router.push("/admin/products");
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Tambah Produk</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-300">Nama Produk</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Tipe Produk</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "GAME_ACCOUNT" | "TOPUP" })}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          >
            <option value="GAME_ACCOUNT">Akun Game</option>
            <option value="TOPUP">Top Up</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Game</label>
          <select
            required
            value={form.gameId}
            onChange={(e) => setForm({ ...form, gameId: e.target.value, categoryId: "" })}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          >
            <option value="">Pilih game</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {selectedGame && selectedGame.categories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm text-gray-300">Kategori</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            >
              <option value="">Tanpa kategori</option>
              {selectedGame.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Harga (Rp)</label>
            <input
              required
              type="number"
              value={form.priceIdr}
              onChange={(e) => setForm({ ...form, priceIdr: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Harga Coret (opsional)</label>
            <input
              type="number"
              value={form.originalPriceIdr}
              onChange={(e) => setForm({ ...form, originalPriceIdr: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
        </div>

        {form.type === "TOPUP" && (
          <div>
            <label className="mb-1 block text-sm text-gray-300">Stok</label>
            <input
              type="number"
              value={form.stockQty}
              onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
        )}

        {form.type === "GAME_ACCOUNT" && (
          <p className="text-xs text-gray-500">
            Untuk akun game, tambahkan kredensial akun (username/password) lewat menu Inventaris Akun setelah produk ini dibuat.
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm text-gray-300">URL Gambar</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://res.cloudinary.com/..."
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Deskripsi</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Garansi</label>
          <input
            value={form.warranty}
            onChange={(e) => setForm({ ...form, warranty: e.target.value })}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div className="flex gap-4 text-sm text-gray-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })} />
            Best Seller
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFlashSale} onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })} />
            Flash Sale
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </form>
    </div>
  );
}
