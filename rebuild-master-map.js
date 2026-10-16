const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");
const fs = require("fs");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

async function main() {
  console.log("");
  console.log("========================================");
  console.log("   FAIN STORE MASTER MAP REBUILDER");
  console.log("========================================");

  const [products, games] = await Promise.all([
    db.product.findMany({
      select: {
        id: true,
        name: true,
        gameId: true,
        priceIdr: true
      },
      orderBy: {
        name: "asc"
      }
    }),

    db.game.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        name: "asc"
      }
    })
  ]);

  console.log("DATABASE PRODUCTS :", products.length);
  console.log("DATABASE GAMES    :", games.length);

  const gameMap = new Map();

  for (const game of games) {
    gameMap.set(game.id, game);
  }

  const result = {};

  let missingGame = 0;
  let missingPrice = 0;
  let missingName = 0;

  for (const product of products) {
    if (!product.name) {
      missingName++;
      continue;
    }

    if (
      product.priceIdr === null ||
      product.priceIdr === undefined
    ) {
      missingPrice++;
    }

    const game = gameMap.get(product.gameId);

    if (!game) {
      missingGame++;
      continue;
    }

    // Jangan membuat master game dari record database yang
    // tidak memiliki nama/slug yang valid.
    const validGameName =
      typeof game.name === "string" &&
      game.name.trim() !== "" &&
      game.name.trim() !== "(";

    const validGameSlug =
      typeof game.slug === "string" &&
      game.slug.trim() !== "";

    if (!validGameName || !validGameSlug) {
      missingGame++;
      continue;
    }

    const key = game.slug;

    if (!result[key]) {
      result[key] = {
        gameId: game.id,
        gameName: game.name,
        slug: game.slug,
        totalProducts: 0,
        products: []
      };
    }

    result[key].totalProducts++;

    result[key].products.push({
      id: product.id,
      name: product.name,
      priceIdr: product.priceIdr
    });
  }

  fs.writeFileSync(
    "./master-product-map.json",
    JSON.stringify(result, null, 2),
    "utf8"
  );

  console.log("----------------------------------------");
  console.log("TOTAL GAME       :", Object.keys(result).length);
  console.log("TOTAL PRODUK     :", products.length);
  console.log("TANPA GAME       :", missingGame);
  console.log("TANPA NAMA       :", missingName);
  console.log("TANPA PRICE IDR  :", missingPrice);
  console.log("----------------------------------------");
  console.log("FILE BERHASIL    : master-product-map.json");

  if (
    missingGame === 0 &&
    missingName === 0 &&
    missingPrice === 0
  ) {
    console.log("----------------------------------------");
    console.log("STATUS: ✅ MASTER MAP VALID");
  } else {
    console.log("----------------------------------------");
    console.log("STATUS: ⚠️ MASIH ADA DATA KOSONG");
  }

  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
