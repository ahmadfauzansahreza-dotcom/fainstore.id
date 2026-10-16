"use client";

import { useEffect, useState } from "react";

interface Settings {
  storeName: string;
  storeDescription: string | null;
  whatsappNumber: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  discord: string | null;
  maintenanceMode: boolean;
  warrantyPolicy: string | null;
  termsContent: string | null;
  privacyContent: string | null;
  refundPolicyContent: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then((res) => res.json()).then(setSettings);
  }, []);

  async function handleSave() {
    if (!settings) return;
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan pengaturan.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <p className="text-sm text-gray-400">Memuat...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold">Pengaturan Toko</h1>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-300">Nama Toko</label>
          <input
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Deskripsi Toko</label>
          <textarea
            value={settings.storeDescription ?? ""}
            onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Nomor WhatsApp</label>
            <input
              value={settings.whatsappNumber ?? ""}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Email</label>
            <input
              value={settings.email ?? ""}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Instagram</label>
            <input
              value={settings.instagram ?? ""}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">TikTok</label>
            <input
              value={settings.tiktok ?? ""}
              onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Discord</label>
            <input
              value={settings.discord ?? ""}
              onChange={(e) => setSettings({ ...settings, discord: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
          />
          Aktifkan Mode Maintenance
        </label>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Kebijakan Garansi</label>
          <textarea
            value={settings.warrantyPolicy ?? ""}
            onChange={(e) => setSettings({ ...settings, warrantyPolicy: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Syarat & Ketentuan</label>
          <textarea
            value={settings.termsContent ?? ""}
            onChange={(e) => setSettings({ ...settings, termsContent: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Kebijakan Privasi</label>
          <textarea
            value={settings.privacyContent ?? ""}
            onChange={(e) => setSettings({ ...settings, privacyContent: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Kebijakan Refund</label>
          <textarea
            value={settings.refundPolicyContent ?? ""}
            onChange={(e) => setSettings({ ...settings, refundPolicyContent: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          {saved ? "Tersimpan ✓" : "Simpan Pengaturan"}
        </button>
        <p className="text-xs text-gray-500">Hanya Super Admin yang dapat menyimpan perubahan pengaturan ini.</p>
      </div>
    </div>
  );
}
