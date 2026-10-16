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
      priceIdr: true,
    },
    orderBy: [
      { gameId: "asc" },
      { categoryId: "asc" },
      { name: "asc" },
    ],
  });

  const missingCoreData = [];
  const invalidPrice = [];
  const duplicateMap = new Map();

  for (const p of products) {
    if (!p.name || !p.gameId || !p.categoryId) {
      missingCoreData.push({
        id: p.id,
        name: p.name,
        gameId: p.gameId,
        categoryId: p.categoryId,
      });
    }

    if (
      p.priceIdr === null ||
      p.priceIdr === undefined ||
      Number(p.priceIdr) <= 0
    ) {
      invalidPrice.push({
        id: p.id,
        name: p.name,
        priceIdr: p.priceIdr,
      });
    }

    const key =
      `${p.gameId}|${p.categoryId}|${String(p.name).toLowerCase().trim()}`;

    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }

    duplicateMap.get(key).push(p);
  }

  const duplicates = [];

  for (const [key, list] of duplicateMap.entries()) {
    if (list.length > 1) {
      duplicates.push({
        key,
        count: list.length,
        products: list
          .map((p) => `${p.id}:${p.name}:Rp${p.priceIdr}`)
          .join(" || "),
      });
    }
  }

  const uniqueGames = new Set(products.map((p) => p.gameId)).size;
  const uniqueCategories = new Set(
    products.map((p) => p.categoryId)
  ).size;

  console.log("\n========================================");
  console.log("ACTIVE PRODUCT INTEGRITY AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.log("\nSUMMARY");
  console.table({
    activeProducts: products.length,
    uniqueGames,
    uniqueCategories,
    missingCoreData: missingCoreData.length,
    invalidPrice: invalidPrice.length,
    duplicateGameCategoryName: duplicates.length,
  });

  console.log("\n========================================");
  console.log("MISSING CORE DATA");
  console.log("========================================");
  console.table(missingCoreData);

  console.log("\n========================================");
  console.log("INVALID PRICE");
  console.log("========================================");
  console.table(invalidPrice);

  console.log("\n========================================");
  console.log("DUPLICATE GAME + CATEGORY + NAME");
  console.log("========================================");
  console.table(duplicates);

  console.log("\n========================================");
  console.log("FINAL RESULT");
  console.log("========================================");

  if (
    missingCoreData.length === 0 &&
    invalidPrice.length === 0 &&
    duplicates.length === 0
  ) {
    console.log("OK: ACTIVE PRODUCT INTEGRITY CLEAN");
  } else {
    console.log("WARNING: masih ada anomaly.");
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
