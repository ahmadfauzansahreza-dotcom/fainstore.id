"use client";

import { useEffect, useState } from "react";

interface Testimonial {
  id: string;
  customerName: string;
  content: string;
  rating: number;
  isApproved: boolean;
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", content: "", rating: "5" });

  function load() {
    fetch("/api/admin/testimonials").then((res) => res.json()).then((data) => setItems(data.items ?? []));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rating: Number(form.rating), isApproved: true }),
    });
    setForm({ customerName: "", content: "", rating: "5" });
    setShowForm(false);
    load();
  }

  async function toggleApproval(id: string, isApproved: boolean) {
    await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !isApproved }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus testimoni ini?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manajemen Testimoni</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {showForm ? "Batal" : "+ Tambah Testimoni"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-md space-y-3 rounded-xl2 border border-border bg-background-secondary/60 p-4">
          <input
            required
            placeholder="Nama customer"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <textarea
            required
            placeholder="Isi testimoni"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <input
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Simpan</button>
        </form>
      )}

      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl2 border border-border bg-background-secondary/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.customerName}</span>
              <span className="text-xs text-accent-gold">★ {t.rating}</span>
            </div>
            <p className="mt-1 text-sm text-gray-300">{t.content}</p>
            <div className="mt-2 flex gap-3 text-xs">
              <button onClick={() => toggleApproval(t.id, t.isApproved)} className={t.isApproved ? "text-emerald-400" : "text-gray-500"}>
                {t.isApproved ? "Tampil" : "Disembunyikan"}
              </button>
              <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:underline">Hapus</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">Belum ada testimoni.</p>}
      </div>
    </div>
  );
}
