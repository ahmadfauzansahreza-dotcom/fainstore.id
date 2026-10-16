import { db } from "../src/lib/db";
import { vipaymentProvider } from "../lib/providers/vipayment";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("========================================");
  console.log("FAIN STORE — VIPAYMENT CATALOG IMPORT");
  console.log("========================================");

  const services = await vipaymentProvider.getProducts(
    undefined,
    "available"
  );

  console.log(`VIPayment services: ${services.length}`);

  if (!services.length) {
    throw new Error("Tidak ada service VIPayment yang tersedia.");
  }

  const games = new Map<string, string>();
  const categories = new Map<string, string>();

  // 1. Buat Game
  const usedGameSlugs = new Set<string>();

  for (const service of services) {
    const gameName = service.game.trim();

    if (games.has(gameName)) continue;

    const baseSlug = slugify(gameName);
    let gameSlug = baseSlug;
    let suffix = 2;

    while (usedGameSlugs.has(gameSlug)) {
      gameSlug = `${baseSlug}-${suffix++}`;
    }

    const existingByName = await db.game.findUnique({
      where: { name: gameName },
    });

    let game;

    if (existingByName) {
      game = await db.game.update({
        where: { id: existingByName.id },
        data: {
          isActive: true,
        },
      });

      usedGameSlugs.add(game.slug);
    } else {
      const existingBySlug = await db.game.findUnique({
        where: { slug: gameSlug },
      });

      if (existingBySlug) {
        gameSlug = `${baseSlug}-${suffix++}`;

        while (await db.game.findUnique({ where: { slug: gameSlug } })) {
          gameSlug = `${baseSlug}-${suffix++}`;
        }
      }

      game = await db.game.create({
        data: {
          name: gameName,
          slug: gameSlug,
          isActive: true,
        },
      });

      usedGameSlugs.add(gameSlug);
    }

    games.set(gameName, game.id);
  }

  // 2. Satu kategori Top Up untuk setiap game
  for (const [gameName, gameId] of games) {
    const categorySlug = `${slugify(gameName)}-top-up`;

    const category = await db.category.upsert({
      where: { slug: categorySlug },
      update: {
        name: "Top Up",
        gameId,
      },
      create: {
        name: "Top Up",
        slug: categorySlug,
        gameId,
      },
    });

    categories.set(gameName, category.id);
  }

  // 3. Buat Product VIPayment
  const rows = services.map((service) => {
    const gameId = games.get(service.game);
    const categoryId = categories.get(service.game);

    if (!gameId || !categoryId) {
      throw new Error(
        `Game/category tidak ditemukan: ${service.game}`
      );
    }

    const priceIdr = Number(service.price?.basic ?? 0);

    if (!Number.isInteger(priceIdr) || priceIdr <= 0) {
      throw new Error(
        `Harga VIPayment tidak valid untuk ${service.code}: ${priceIdr}`
      );
    }

    return {
      name: service.name,
      slug: `vipayment-${slugify(service.code)}`,
      type: "TOPUP" as const,
      gameId,
      categoryId,
      description: `${service.name} - ${service.game}`,
      specifications: {
        provider: "vipayment",
        code: service.code,
        game: service.game,
        server: service.server ?? null,
        status: service.status ?? "available",
        prices: {
          basic: service.price?.basic ?? null,
          premium: service.price?.premium ?? null,
          special: service.price?.special ?? null,
        },
      },
      priceIdr,
      originalPriceIdr: null,
      discountPct: null,
      stockQty: 999999,
      isFeatured: false,
      isBestSeller: false,
      isFlashSale: false,
      status: service.status === "available",
      soldCount: 0,
      warranty: null,
      isDemo: false,
    };
  });

  await db.product.createMany({
    data: rows,
    skipDuplicates: true,
  });

  const [gameCount, categoryCount, productCount] =
    await Promise.all([
      db.game.count(),
      db.category.count(),
      db.product.count(),
    ]);

  console.log("");
  console.log("========================================");
  console.log("VIPAYMENT IMPORT SELESAI");
  console.log("========================================");
  console.log(`VIPayment services : ${services.length}`);
  console.log(`Games              : ${gameCount}`);
  console.log(`Categories         : ${categoryCount}`);
  console.log(`Products           : ${productCount}`);
  console.log("Provider           : vipayment");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("VIPAYMENT IMPORT FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
