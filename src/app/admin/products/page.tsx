"use client";

import { useEffect, useState } from "react";
import { formatIdr } from "@/lib/money";

interface AdminProduct {
  id: string;
  name: string;
  priceIdr: number;
  stockQty: number;
  status: boolean;
  type: string;
  game: { name: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini? Produk akan disembunyikan dari katalog.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manajemen Produk</h1>
        <a
          href="/admin/products/new"
          className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Tambah Produk
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-secondary text-gray-400">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.game.name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.type}</td>
                  <td className="px-4 py-3">{formatIdr(p.priceIdr)}</td>
                  <td className="px-4 py-3">{p.stockQty}</td>
                  <td className="px-4 py-3">
                    <span className={p.status ? "text-emerald-400" : "text-red-400"}>
                      {p.status ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <a href={`/admin/products/${p.id}/edit`} className="text-accent-blue hover:underline">
                        Edit
                      </a>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:underline">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="p-4 text-sm text-gray-500">Belum ada produk.</p>}
        </div>
      )}
    </div>
  );
}
