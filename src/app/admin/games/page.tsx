"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
}
interface Game {
  id: string;
  name: string;
  categories: Category[];
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [newGameName, setNewGameName] = useState("");
  const [categoryForms, setCategoryForms] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/games").then((res) => res.json()).then((data) => setGames(data.items ?? []));
  }
  useEffect(load, []);

  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGameName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menambah game.");
      return;
    }
    setNewGameName("");
    load();
  }

  async function handleAddCategory(gameId: string) {
    const name = categoryForms[gameId];
    if (!name) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gameId }),
    });
    if (res.ok) {
      setCategoryForms((prev) => ({ ...prev, [gameId]: "" }));
      load();
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Manajemen Game & Kategori</h1>

      <form onSubmit={handleAddGame} className="mb-6 flex max-w-md gap-2">
        <input
          required
          placeholder="Nama game baru (mis. PUBG Mobile)"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Tambah
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="rounded-xl2 border border-border bg-background-secondary/60 p-4">
            <h3 className="font-semibold text-white">{game.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {game.categories.map((c) => (
                <span key={c.id} className="rounded-full border border-border px-3 py-1 text-xs text-gray-300">
                  {c.name}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                placeholder="Tambah kategori baru"
                value={categoryForms[game.id] ?? ""}
                onChange={(e) => setCategoryForms((prev) => ({ ...prev, [game.id]: e.target.value }))}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-white focus:border-accent-blue focus:outline-none"
              />
              <button
                onClick={() => handleAddCategory(game.id)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-white hover:bg-white/5"
              >
                + Kategori
              </button>
            </div>
          </div>
        ))}
        {games.length === 0 && <p className="text-sm text-gray-500">Belum ada game.</p>}
      </div>
    </div>
  );
}
