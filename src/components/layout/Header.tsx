"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Menu,
  X,
  Check,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/top-up", label: "Top Up" },
  { href: "/akun/orders", label: "Cek Transaksi" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Hubungi Kami" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState<
    { id: string; name: string; slug: string; imageUrl?: string | null }[]
  >([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen || games.length > 0) return;

    let cancelled = false;

    fetch("/api/games", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil game");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setGames(data.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      });

    return () => {
      cancelled = true;
    };
  }, [searchOpen, games.length]);

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [searchOpen]);

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return games.slice(0, 8);

    return games
      .filter((game) => {
        const name = game.name.toLowerCase();
        const slug = game.slug.toLowerCase();

        return (
          name.includes(query) ||
          slug.includes(query)
        );
      })
      .slice(0, 8);
  }, [games, searchQuery]);

  function openSearch() {
    setSearchOpen(true);
    setMobileOpen(false);
    setLocaleOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <header className="fain-glass-header sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl">
      <div className="mx-auto flex h-[82px] max-w-7xl items-center justify-between px-4 sm:h-[86px] sm:px-6 lg:px-8">

        {/* LOGO */}
        <Link
          href="/"
          aria-label="FAIN STORE"
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center"
        >
          <Image
            src="/logo-fain.png"
            alt="FAIN STORE"
            width={220}
            height={90}
            priority
            className="h-[60px] w-auto max-w-[170px] object-contain sm:h-[62px] sm:max-w-[180px]"
          />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/akun"
            className="text-sm font-medium text-white/65 transition-colors hover:text-white"
          >
            Akun
          </Link>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

          {/* SEARCH */}
          <button
            type="button"
            aria-label="Cari game atau layanan"
            aria-expanded={searchOpen}
            onClick={openSearch}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
          >
            <Search className="h-[21px] w-[21px]" />
          </button>

          {/* LOCALE */}
          <div className="relative">
            <button
              type="button"
              aria-label="Bahasa dan mata uang"
              aria-expanded={localeOpen}
              onClick={() => {
                setLocaleOpen((value) => !value);
                setMobileOpen(false);
              }}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              <span className="text-base leading-none">🇮🇩</span>
              <span className="whitespace-nowrap text-[11px] font-semibold sm:text-xs">
                ID / IDR
              </span>
            </button>

            {localeOpen && (
              <>
                <button
                  type="button"
                  aria-label="Tutup pilihan bahasa"
                  onClick={() => setLocaleOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] rounded-2xl border border-white/10 bg-[#171717] p-4 shadow-2xl shadow-black/40">
                  <div>
                    <p className="mb-2 text-xs font-bold text-white">
                      Lokasi
                    </p>

                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/[0.04] px-3 py-3 text-sm text-white"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">🇮🇩</span>
                        Indonesia (ID)
                      </span>

                      <Check className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold text-white">
                      Bahasa
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="flex items-center justify-between rounded-xl border border-white/20 bg-white/[0.04] px-3 py-3 text-sm text-white"
                      >
                        <span className="flex items-center gap-2">
                          🇮🇩 ID
                        </span>

                        <Check className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white/40"
                      >
                        🇬🇧 EN
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MOBILE MENU */}
          <button
            type="button"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen((value) => !value);
              setLocaleOpen(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-[20px] w-[20px]" />
            ) : (
              <Menu className="h-[22px] w-[22px]" />
            )}
          </button>
        </div>
      </div>

      {/* GAME SEARCH */}
      {searchOpen && (
        <>
          <button
            type="button"
            aria-label="Tutup pencarian"
            onClick={closeSearch}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-[2px]"
          />

          <div className="absolute inset-x-0 top-full z-[60] border-b border-white/10 bg-[#090909] shadow-2xl shadow-black/50">
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />

                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      closeSearch();
                    }
                  }}
                  placeholder="Cari game atau layanan..."
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d6a84a]/50"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-[min(60vh,480px)] overflow-y-auto">
                {!searchQuery.trim() ? (
                  <div>
                    <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Game Populer
                    </p>

                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {filteredGames.map((game) => (
                        <Link
                          key={game.id}
                          href={`/game/${game.slug}`}
                          onClick={closeSearch}
                          className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.06]"
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                            {game.imageUrl ? (
                              <img
                                src={game.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Search className="h-4 w-4 text-white/25" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {game.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-white/35">
                              Top Up
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : filteredGames.length > 0 ? (
                  <div>
                    <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Hasil Pencarian
                    </p>

                    <div className="space-y-1">
                      {filteredGames.map((game) => (
                        <Link
                          key={game.id}
                          href={`/game/${game.slug}`}
                          onClick={closeSearch}
                          className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.06]"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                            {game.imageUrl ? (
                              <img
                                src={game.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Search className="h-4 w-4 text-white/25" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {game.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-white/35">
                              /game/{game.slug}
                            </p>
                          </div>

                          <span className="text-white/25">›</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-2 py-10 text-center">
                    <Search className="mx-auto h-7 w-7 text-white/20" />
                    <p className="mt-3 text-sm font-medium text-white/70">
                      Game tidak ditemukan
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      Coba gunakan nama game yang lain.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#090909] lg:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/akun"
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                Akun
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
