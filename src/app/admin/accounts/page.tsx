"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

interface ProductOption {
  id: string;
  name: string;
  type: string;
}

interface AccountRow {
  id: string;
  loginMethod: string | null;
  status: string;
  createdAt: string;
  soldAt: string | null;
}

export default function AdminAccountsPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [revealed, setRevealed] = useState<Record<string, { usernameEmail: string; password: string; recoveryData: string | null }>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ loginMethod: "", usernameEmail: "", password: "", recoveryData: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => {
        const gameAccountProducts = (data.items ?? []).filter((p: ProductOption) => p.type === "GAME_ACCOUNT");
        setProducts(gameAccountProducts);
        if (gameAccountProducts[0]) setSelectedProductId(gameAccountProducts[0].id);
      });
  }, []);

  function loadAccounts(productId: string) {
    if (!productId) return;
    fetch(`/api/admin/accounts?productId=${productId}`)
      .then((res) => res.json())
      .then((data) => setAccounts(data.items ?? []));
  }

  useEffect(() => {
    loadAccounts(selectedProductId);
    setRevealed({});
  }, [selectedProductId]);

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProductId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menambah akun.");
      return;
    }
    setForm({ loginMethod: "", usernameEmail: "", password: "", recoveryData: "" });
    setShowForm(false);
    loadAccounts(selectedProductId);
  }

  async function handleReveal(id: string) {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const res = await fetch(`/api/admin/accounts/${id}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setRevealed((prev) => ({ ...prev, [id]: data }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus akun ini dari inventaris?")) return;
    const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    if (res.ok) loadAccounts(selectedProductId);
    else {
      const data = await res.json();
      alert(data.error ?? "Gagal menghapus akun.");
    }
  }

  const statusColor: Record<string, string> = {
    AVAILABLE: "text-emerald-400",
    RESERVED: "text-yellow-400",
    SOLD: "text-gray-500",
    DISABLED: "text-red-400",
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Inventaris Akun Game</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          disabled={!selectedProductId}
          className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {showForm ? "Batal" : "+ Tambah Akun"}
        </button>
      </div>

      {products.length === 0 && (
        <p className="text-sm text-gray-500">Belum ada produk bertipe Akun Game. Tambahkan produk terlebih dahulu di menu Produk.</p>
      )}

      {showForm && (
        <form onSubmit={handleAddAccount} className="mb-6 max-w-md space-y-3 rounded-xl2 border border-border bg-background-secondary/60 p-4">
          <input
            placeholder="Metode login (mis. Email, Google, Facebook)"
            value={form.loginMethod}
            onChange={(e) => setForm({ ...form, loginMethod: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <input
            required
            placeholder="Username / Email akun"
            value={form.usernameEmail}
            onChange={(e) => setForm({ ...form, usernameEmail: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <input
            required
            placeholder="Password akun"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <textarea
            placeholder="Info pemulihan (opsional)"
            value={form.recoveryData}
            onChange={(e) => setForm({ ...form, recoveryData: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
          <p className="text-xs text-gray-500">Kredensial akan dienkripsi sebelum disimpan ke database.</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Simpan Akun
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl2 border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-secondary text-gray-400">
            <tr>
              <th className="px-4 py-3">Metode Login</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ditambahkan</th>
              <th className="px-4 py-3">Kredensial</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-t border-border align-top">
                <td className="px-4 py-3">{acc.loginMethod ?? "-"}</td>
                <td className={`px-4 py-3 font-medium ${statusColor[acc.status]}`}>{acc.status}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(acc.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3">
                  {revealed[acc.id] ? (
                    <div className="space-y-0.5 font-mono text-xs">
                      <p>{revealed[acc.id].usernameEmail}</p>
                      <p>{revealed[acc.id].password}</p>
                    </div>
                  ) : (
                    <span className="text-gray-500">••••••••</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleReveal(acc.id)} className="text-accent-blue hover:underline">
                      {revealed[acc.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {acc.status !== "SOLD" && (
                      <button onClick={() => handleDelete(acc.id)} className="text-red-400 hover:underline">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 && <p className="p-4 text-sm text-gray-500">Belum ada akun untuk produk ini.</p>}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Setiap kali kredensial ditampilkan (reveal), aksi tersebut tercatat di Audit Log demi keamanan.
      </p>
    </div>
  );
}
