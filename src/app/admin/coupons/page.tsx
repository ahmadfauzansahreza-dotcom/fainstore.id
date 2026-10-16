"use client";

import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  percentage: number | null;
  fixedAmountIdr: number | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    percentage: "10",
    fixedAmountIdr: "",
    minPurchaseIdr: "",
    startDate: "",
    endDate: "",
  });
  const [error, setError] = useState<string | null>(null);

  function loadCoupons() {
    fetch("/api/admin/coupons").then((res) => res.json()).then((data) => setCoupons(data.items ?? []));
  }

  useEffect(loadCoupons, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discountType: form.discountType,
        percentage: form.discountType === "PERCENTAGE" ? Number(form.percentage) : undefined,
        fixedAmountIdr: form.discountType === "FIXED" ? Number(form.fixedAmountIdr) : undefined,
        minPurchaseIdr: form.minPurchaseIdr ? Number(form.minPurchaseIdr) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan kupon.");
      return;
    }
    setShowForm(false);
    loadCoupons();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadCoupons();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kupon ini?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    loadCoupons();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manajemen Kupon</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {showForm ? "Batal" : "+ Tambah Kupon"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-lg space-y-3 rounded-xl2 border border-border bg-background-secondary/60 p-4">
          <input
            required
            placeholder="Kode kupon (mis. FAIN10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          >
            <option value="PERCENTAGE">Persentase</option>
            <option value="FIXED">Nominal Tetap</option>
          </select>
          {form.discountType === "PERCENTAGE" ? (
            <input
              type="number"
              placeholder="Persentase diskon"
              value={form.percentage}
              onChange={(e) => setForm({ ...form, percentage: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          ) : (
            <input
              type="number"
              placeholder="Nominal diskon (Rp)"
              value={form.fixedAmountIdr}
              onChange={(e) => setForm({ ...form, fixedAmountIdr: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          )}
          <input
            type="number"
            placeholder="Minimal pembelian (opsional)"
            value={form.minPurchaseIdr}
            onChange={(e) => setForm({ ...form, minPurchaseIdr: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Simpan
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl2 border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-secondary text-gray-400">
            <tr>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Diskon</th>
              <th className="px-4 py-3">Berlaku</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">
                  {c.discountType === "PERCENTAGE" ? `${c.percentage}%` : `Rp${c.fixedAmountIdr?.toLocaleString("id-ID")}`}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(c.startDate).toLocaleDateString("id-ID")} – {new Date(c.endDate).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c.id, c.isActive)} className={c.isActive ? "text-emerald-400" : "text-gray-500"}>
                    {c.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-4 text-sm text-gray-500">Belum ada kupon.</p>}
      </div>
    </div>
  );
}
