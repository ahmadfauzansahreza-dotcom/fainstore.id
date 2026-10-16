"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    priceIdr: "",
    originalPriceIdr: "",
    stockQty: "0",
    warranty: "",
    isFeatured: false,
    isBestSeller: false,
    isFlashSale: false,
    status: true,
  });

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => {
        const product = (data.items ?? []).find((p: { id: string }) => p.id === params.id);
        if (product) {
          setForm({
            name: product.name,
            description: product.description ?? "",
            priceIdr: String(product.priceIdr),
            originalPriceIdr: product.originalPriceIdr ? String(product.originalPriceIdr) : "",
            stockQty: String(product.stockQty),
            warranty: product.warranty ?? "",
            isFeatured: product.isFeatured,
            isBestSeller: product.isBestSeller,
            isFlashSale: product.isFlashSale,
            status: product.status,
          });
        }
        setLoading(false);
      });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/admin/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        priceIdr: Number(form.priceIdr),
        originalPriceIdr: form.originalPriceIdr ? Number(form.originalPriceIdr) : undefined,
        stockQty: Number(form.stockQty),
        warranty: form.warranty || undefined,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isFlashSale: form.isFlashSale,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan perubahan.");
      setSubmitting(false);
      return;
    }
    router.push("/admin/products");
  }

  if (loading) return <p className="text-sm text-gray-400">Memuat...</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Edit Produk</h1>
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
            <label className="mb-1 block text-sm text-gray-300">Harga Coret</label>
            <input
              type="number"
              value={form.originalPriceIdr}
              onChange={(e) => setForm({ ...form, originalPriceIdr: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Stok (khusus produk Top Up)</label>
          <input
            type="number"
            value={form.stockQty}
            onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
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

        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
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
          {submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
