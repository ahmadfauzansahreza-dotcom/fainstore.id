"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", position: "0" });
  const [error, setError] = useState<string | null>(null);

  function loadBanners() {
    fetch("/api/admin/banners").then((res) => res.json()).then((data) => setBanners(data.items ?? []));
  }

  useEffect(loadBanners, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        position: Number(form.position),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan banner.");
      return;
    }
    setForm({ title: "", imageUrl: "", linkUrl: "", position: "0" });
    setShowForm(false);
    loadBanners();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus banner ini?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    loadBanners();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manajemen Banner</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {showForm ? "Batal" : "+ Tambah Banner"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-md space-y-3 rounded-xl2 border border-border bg-background-secondary/60 p-4">
          <input
            required
            placeholder="Judul banner"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <input
            required
            placeholder="URL gambar (Cloudinary)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <input
            placeholder="Link tujuan (opsional)"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <input
            type="number"
            placeholder="Urutan tampil"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Simpan
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl2 border border-border bg-background-secondary/60">
            <div className="relative aspect-[3/1]">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm">{b.title}</span>
              <button onClick={() => handleDelete(b.id)} className="text-xs text-red-400 hover:underline">
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
      {banners.length === 0 && <p className="text-sm text-gray-500">Belum ada banner.</p>}
    </div>
  );
}
