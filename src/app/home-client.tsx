"use client";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import HeroBannerCarousel from "@/components/HeroBannerCarousel";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Gamepad2,
  ShieldCheck,
  Zap,
  CreditCard,
  Search,
  Sparkles,
  ShoppingCart,
} from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  priceIdr: number;
  originalPriceIdr?: number | null;
  discountPct?: number | null;
  stockQty: number;
  soldCount: number;
  images?: {
    url: string;
  }[];
  game?: {
    name: string;
    slug: string;
  };
  category?: {
    id?: string;
    name: string;
    slug: string;
  } | null;
  type?: "GAME_ACCOUNT" | "TOPUP";
}

interface Game {
  id?: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  isActive?: boolean;
  categories?: {
    id?: string;
    name: string;
    slug: string;
  }[];
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

type HomePageProps = {
  initialGames: Game[];
};

export default function HomePage({ initialGames }: HomePageProps) {
  const router = useRouter();
  const [navigatingGameSlug, setNavigatingGameSlug] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(true);
  const [selectedProductCategory, setSelectedProductCategory] = useState<"TOPUP" | "VOUCHER" | "LIVE_APP">("TOPUP");
  const [visibleCount, setVisibleCount] = useState(12);

  // Naik setiap kali homepage dipulihkan setelah membuka game.
  // Token ini hanya digunakan untuk me-remount card katalog.
  const [catalogRevealToken, setCatalogRevealToken] = useState(0);

  useEffect(() => {
    const checkReturnHome = () => {
      try {
        if (sessionStorage.getItem("fain-store-return-home") !== "1") {
          return;
        }

        sessionStorage.removeItem("fain-store-return-home");

        // Pastikan browser sudah menyelesaikan render route.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setCatalogRevealToken((value) => value + 1);
          });
        });
      } catch {
        // sessionStorage tidak tersedia.
      }
    };

    checkReturnHome();

    const onPageShow = () => {
      checkReturnHome();
    };

    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const handleShowMore = () => {
    setVisibleCount((current) => Math.min(current + 12, games.length));
  };

  const handleShowLess = () => {
    setVisibleCount(12);
  };

  const [canonicalMap, setCanonicalMap] = useState<Record<string, string | null>>({});
  const [catalogTab, setCatalogTab] = useState<"game" | "voucher" | "app">("game");


  useEffect(() => {
    let cancelled = false;

    // Tampilkan cache game seketika saat kembali membuka homepage.
    // API tetap dijalankan untuk mendapatkan data terbaru di background.
    try {
      const cachedGames = sessionStorage.getItem(
        "fain-store-games-cache"
      );

      if (cachedGames) {
        const parsedGames = JSON.parse(cachedGames);

        if (Array.isArray(parsedGames) && parsedGames.length > 0) {
          setGames(parsedGames);
        }
      }
    } catch {
      // Cache rusak/tidak tersedia — lanjutkan normal.
    }

    const loadGames = async () => {
      try {
        const gamesRes = await fetch("/api/games", { cache: "force-cache" });

        if (!gamesRes.ok) {
          throw new Error(`Games API ${gamesRes.status}`);
        }

        const gamesData = await gamesRes.json();

        if (!cancelled) {
          const freshGames = gamesData.items ?? [];
          setGames(freshGames);

          try {
            window.localStorage.setItem(
              "fain-store-games-cache",
              JSON.stringify(freshGames)
            );
          } catch {
            // Cache browser gagal disimpan — data tetap tampil normal.
          }
        }
      } catch (error) {
        console.error("Games API error:", error);

        if (!cancelled) {
          console.warn(
            "Games background refresh gagal; mempertahankan initialGames."
          );
        }
      }
    };

    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products?pageSize=100", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Products API ${res.status}`);
        }

        const data = await res.json();

        if (!cancelled) {
          setProducts(data.items ?? []);
        }
      } catch (error) {
        console.error("Products API error:", error);

        if (!cancelled) {
          setProducts([]);
        }
      }
    };

    const loadCanonicalMap = async () => {
      try {
        const canonicalRes = await fetch("/canonical-game-map.json", {
          cache: "no-store",
        });

        if (canonicalRes.ok) {
          const canonicalData = await canonicalRes.json();

          if (!cancelled) {
            setCanonicalMap(canonicalData.aliases ?? {});
          }
        }
      } catch (error) {
        console.warn("Canonical game map unavailable:", error);

        if (!cancelled) {
          setCanonicalMap({});
        }
      }
    };

    // Semua sumber data berjalan independen.
    // Kegagalan Products tidak boleh menghilangkan Games.
    loadGames();

    // Products bukan dependency utama untuk menampilkan card game.
    // Tunda request berat sampai browser lebih idle.
    const idleLoadProducts = () => {
      loadProducts();
    };

    const idleId = setTimeout(idleLoadProducts, 800);

    loadCanonicalMap();

    // Jangan menahan homepage sampai Products selesai.
    setLoading(false);

    return () => {
      cancelled = true;

      clearTimeout(idleId);
    };
  }, []);


  const categoryMatchers: Record<
    "topup" | "voucher" | "live",
    (categoryName: string, categorySlug: string) => boolean
  > = {
    topup: (name, slug) =>
      name.toLowerCase().includes("top up") ||
      name.toLowerCase().includes("topup") ||
      slug.toLowerCase().includes("top-up") ||
      slug.toLowerCase().includes("topup"),

    voucher: (name, slug) =>
      name.toLowerCase().includes("voucher") ||
      slug.toLowerCase().includes("voucher"),

    live: (name, slug) => {
      const premiumSlugs = [
        "canva-pro",
        "bstation-premium",
        "alight-motion",
        "capcut-pro",
        "youtube-premium",
        "iqiyi-premium",
        "vidio-premier",
        "vision-plus",
        "viu-premium",
        "wetv-premium",
        "gemini",
        "amazon-prime-video",
      ];

      return premiumSlugs.includes(slug.toLowerCase());
    },
  };

  const catalogGames = useMemo(() => {
    const premiumSlugs = new Set([
      "canva-pro",
      "bstation-premium",
      "alight-motion",
      "capcut-pro",
      "youtube-premium",
      "iqiyi-premium",
      "vidio-premier",
      "vision-plus",
      "viu-premium",
      "wetv-premium",
      "gemini",
      "amazon-prime-video",
    ]);

    const grouped = new Map<string, Game>();

    for (const game of games) {
      if (game.isActive === false) continue;

      const canonicalSlug =
        canonicalMap[game.slug] ?? game.slug;

      const existing = grouped.get(canonicalSlug);

      if (!existing || game.slug === canonicalSlug) {
        grouped.set(canonicalSlug, game);
      }
    }

    const allGames = Array.from(grouped.values());

    const appStreamSlugs = new Set([
      "alight-motion",
      "amazon-prime-video",
      "bstation-premium",
      "canva-pro",
      "capcut-pro",
      "gemini",
      "iqiyi-premium",
      "likee",
      "lita",
      "vidio-premier",
      "vision-plus",
      "viu-premium",
      "wetv-premium",
      "youtube-premium",
    ]);

    const isVoucher = (game: Game) => {
      const slug = game.slug.toLowerCase();

      return (
        slug === "steam-wallet-code" ||
        slug.startsWith("voucher-")
      );
    };

    const isAppStream = (game: Game) =>
      appStreamSlugs.has(game.slug.toLowerCase());

    if (catalogTab === "voucher") {
      return allGames.filter(isVoucher);
    }

    if (catalogTab === "app") {
      return allGames.filter(isAppStream);
    }

    // Game = seluruh layanan yang bukan Voucher
    // dan bukan App & Stream.
    return allGames.filter(
      (game) => !isVoucher(game) && !isAppStream(game)
    );
  }, [games, canonicalMap, catalogTab]);

  const handleGameCardClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    slug: string
  ) => {
    event.preventDefault();

    if (navigatingGameSlug) return;

    try {
      sessionStorage.setItem("fain-store-return-home", "1");
    } catch {
      // sessionStorage tidak tersedia.
    }

    // State ini sengaja dipasang sinkron dengan tap.
    // CSS akan menjalankan press sequence sebelum navigasi.
    setNavigatingGameSlug(slug);

    window.setTimeout(() => {
      router.push(`/game/${slug}`);
    }, 220);
  };

  const visibleGames = catalogGames.slice(0, visibleCount);


  const popularGames = [
    "free-fire",
    "mobile-legends-b",
    "roblox-voucher",
    "pubg-mobile-id",
    "genshin-impact",
    "valorant",
  ]
    .map((slug) => {
      const game = games.find(
        (item) => item.slug.toLowerCase() === slug
      );

      return game
        ? {
            ...game,
            image: game.imageUrl || "/placeholder-product.jpg",
          }
        : null;
    })
    .filter(
      (
        game
      ): game is Game & {
        image: string;
      } => Boolean(game)
    );

  return (
    <>
      <Header />

      <main className="fain-home-shell relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(45deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 6px)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-15%] top-[18%] -z-0 h-[420px] w-[420px] rounded-full bg-[#d6a84a]/[0.035] blur-[140px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12%] top-[42%] -z-0 h-[520px] w-[520px] rounded-full bg-[#d6a84a]/[0.025] blur-[160px]"
      />


      {/* =========================================================
          HERO
      ========================================================= */}
        {/* HERO BANNER */}
        {/* =========================================================
            HERO BANNER CAROUSEL
        ========================================================= */}
                {/* =========================================================
            POPULAR GAMES — ITSUGAMARKET STYLE
        ========================================================= */}
        <section className="relative">
          <div className="mx-auto max-w-7xl px-3 pt-3 pb-3 sm:px-6 sm:pt-5 sm:pb-4 lg:px-8">
            <div className="relative block w-full">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
                <HeroBannerCarousel />
              </div>
            </div>
          </div>
        </section>

        <section className="fain-section-surface mx-auto max-w-7xl px-3 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 lg:px-8">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>

              <h2 className="text-xl font-black sm:text-2xl">
                POPULER SEKARANG!
              </h2>
            </div>

            <p className="mt-2 text-xs text-white/50 sm:text-sm">
              Berikut adalah beberapa game yang paling populer saat ini.
            </p>
          </div>

          {popularGames.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-3">
              {popularGames.map((game, index) => {
                const gameImage =
                  game.imageUrl || "/placeholder-product.jpg";

                const isNavigating =
                  navigatingGameSlug === game.slug;

                return (
                  <div
                    key={`popular-${game.slug}-${catalogRevealToken}`}
                    className={[
                      "fain-card-popular-return",
                      catalogRevealToken > 0
                        ? "fain-card-popular-returning"
                        : "",
                      
                    ].join(" ")}
                    style={{
                      animationDelay:
                        catalogRevealToken > 0
                          ? `${index * 55}ms`
                          : undefined,
                    }}
                  >
                    <Link
                      href={`/game/${game.slug}`}
                      prefetch={true}
                      onClick={(event) =>
                        handleGameCardClick(event, game.slug)
                      }
                      className={[
                        "fain-card-press fain-premium-card group relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 transition-all duration-300 hover:-translate-y-1 active:scale-[0.965]",
                        isNavigating ? "fain-card-press-navigating" : "",
                      ].join(" ")}
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#d6a84a]/0 via-[#d6a84a]/0 to-[#d6a84a]/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />

                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                        <img
                          src={gameImage}
                          alt={game.name}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        />

                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                      </div>

                      <div className="relative min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white transition-colors duration-200 group-hover:text-[#d6a84a]">
                          {game.name}
                        </p>

                        <p className="mt-1 text-[9px] text-white/40 transition-colors duration-200 group-hover:text-white/55">
                          FAIN STORE
                        </p>
                      </div>

                      <ChevronRight className="relative h-4 w-4 shrink-0 text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#d6a84a]" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fain-premium-card rounded-2xl p-8 text-center text-sm text-white/50">
              Game populer belum tersedia.
            </div>
          )}
        </section>

        {/* =========================================================
            




      {/* =========================================================
          GAME CATALOG — ITSUGAMARKET STYLE
      ========================================================= */}
      <section className="fain-section-surface mx-auto max-w-7xl px-3 pt-6 pb-9 sm:px-6 sm:pt-7 lg:px-8">

        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>

            <h2 className="text-xl font-black sm:text-2xl">
              PILIH GAME
            </h2>
          </div>

          <p className="mt-2 text-xs text-white/50 sm:text-sm">
            Pilih layanan game yang ingin kamu gunakan.
          </p>
        </div>

        {/* CATEGORY TABS */}
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          {[
            { id: "game", label: "Game" },
            { id: "voucher", label: "Voucher" },
            { id: "app", label: "App & Stream" },
          ].map((tab) => {
            const active = catalogTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCatalogTab(
                    tab.id as "game" | "voucher" | "app"
                  );
                  setVisibleCount(12);
                }}
                className={[
                  "fain-category-tab h-11 rounded-xl border text-sm font-bold transition",
                  active
                      ? "fain-category-tab-active"
                      : "fain-category-tab-idle",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {(() => {


          return catalogGames.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3 sm:gap-3.5">
                {visibleGames.map((game, index) => (
                  <div
                      key={
                        catalogRevealToken > 0
                          ? `${game.slug}-return-${catalogRevealToken}`
                          : game.slug
                      }
                      className={[
                        catalogRevealToken > 0 ? "fain-card-return" : "",
                        
                      ].join(" ")}
                      style={
                        catalogRevealToken > 0
                          ? {
                              animationDelay: `${index * 55}ms`,
                            }
                          : undefined
                      }
                    >
                      <Link
                      onClick={(event) => handleGameCardClick(event, game.slug)}
                      href={`/game/${game.slug}`}
                      prefetch={true}
                      className={[
                        "fain-card-press fain-premium-card group block overflow-hidden rounded-2xl",
                        navigatingGameSlug === game.slug
                          ? "fain-card-press-navigating"
                          : "",
                      ].join(" ")}
                    >
                      <div>
                        <div className="relative aspect-square w-full overflow-hidden bg-black/20">
                          <img
                            src={game.imageUrl ?? undefined}
                            alt={game.name}
                            loading={index < 6 ? "eager" : "lazy"}
                              decoding="async"
                              className="block h-full w-full object-cover"
                          />
                        </div>

                        <div className="px-3 py-2.5">
                          <h3 className="truncate text-sm font-bold text-white transition-colors duration-300 group-hover:text-[#d6a84a]">
                            {game.name}
                          </h3>

                          <p className="mt-1 text-[10px] text-white/40">
                            {catalogTab === "game"
                              ? "Game"
                              : catalogTab === "voucher"
                                ? "Voucher"
                                : "App & Stream"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {catalogGames.length > 12 && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  {visibleCount < catalogGames.length && (
                    <button
                      type="button"
                      onClick={handleShowMore}
                      className="fain-load-more w-auto min-w-[220px]"
                    >
                      Tampilkan Lebih Banyak
                    </button>
                  )}

                  {visibleCount > 12 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(12)}
                      className="text-xs font-semibold text-white/40 transition hover:text-white/70"
                    >
                      Tampilkan Lebih Sedikit
                    </button>
                  )}
                </div>
              )}


          </>
          ) : (
            <div className="fain-premium-card rounded-2xl px-5 py-12 text-center">
              <Gamepad2 className="mx-auto h-10 w-10 text-white/20" />

              <p className="mt-4 text-sm font-semibold text-white/60">
                Belum ada game untuk kategori ini.
              </p>

              <p className="mt-1 text-xs text-white/35">
                Game akan muncul setelah produk kategorinya tersedia.
              </p>
            </div>
          );
        })()}

      </section>

      {/* =========================================================
          WHY FAIN STORE
      ========================================================= */}
      


      {/* =========================================================
          CTA
      ========================================================= */}
      


      {/* =========================================================
          FOOTER
      ========================================================= */}
      


    
          <Footer />

</main>
<MobileBottomNav />
    </>
  );
}
