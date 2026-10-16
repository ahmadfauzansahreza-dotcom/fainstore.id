require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    where: {
      status: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      gameId: true,
      categoryId: true,
    },
  });

  const games = await prisma.game.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      gameId: true,
    },
  });

  const gameMap = new Map(games.map((g) => [g.id, g]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const missingGame = [];
  const missingCategory = [];
  const wrongGameCategory = [];

  for (const p of products) {
    const game = gameMap.get(p.gameId);
    const category = categoryMap.get(p.categoryId);

    if (!game) {
      missingGame.push({
        id: p.id,
        name: p.name,
        gameId: p.gameId,
      });
    }

    if (!category) {
      missingCategory.push({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
      });
    }

    if (
      game &&
      category &&
      category.gameId !== p.gameId
    ) {
      wrongGameCategory.push({
        id: p.id,
        product: p.name,
        game: `${game.id}:${game.name}`,
        category: `${category.id}:${category.name}`,
        categoryGameId: category.gameId,
      });
    }
  }

  const gameCounts = new Map();

  for (const p of products) {
    gameCounts.set(
      p.gameId,
      (gameCounts.get(p.gameId) || 0) + 1
    );
  }

  console.log("\n========================================");
  console.log("ACTIVE PRODUCT MAPPING AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.log("\nSUMMARY");
  console.table({
    activeProducts: products.length,
    games: games.length,
    categories: categories.length,
    missingGame: missingGame.length,
    missingCategory: missingCategory.length,
    wrongGameCategory: wrongGameCategory.length,
  });

  console.log("\n========================================");
  console.log("MISSING GAME");
  console.log("========================================");
  console.table(missingGame);

  console.log("\n========================================");
  console.log("MISSING CATEGORY");
  console.log("========================================");
  console.table(missingCategory);

  console.log("\n========================================");
  console.log("CATEGORY ↔ GAME MISMATCH");
  console.log("========================================");
  console.table(wrongGameCategory);

  console.log("\n========================================");
  console.log("PRODUCT COUNT BY GAME");
  console.log("========================================");

  console.table(
    [...gameCounts.entries()]
      .map(([gameId, count]) => ({
        gameId,
        gameName: gameMap.get(gameId)?.name || "UNKNOWN",
        activeProducts: count,
      }))
      .sort((a, b) => b.activeProducts - a.activeProducts)
  );

  console.log("\n========================================");
  console.log("FINAL RESULT");
  console.log("========================================");

  if (
    missingGame.length === 0 &&
    missingCategory.length === 0 &&
    wrongGameCategory.length === 0
  ) {
    console.log("OK: seluruh mapping GAME → CATEGORY → PRODUCT valid.");
  } else {
    console.log("WARNING: ditemukan masalah mapping.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
