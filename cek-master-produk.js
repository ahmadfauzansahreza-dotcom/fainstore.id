const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("");
  console.log("========================================");
  console.log("      FAIN STORE MASTER PRODUCT MAP");
  console.log("========================================");
  console.log("");

  // ==============================
  // AMBIL SEMUA PRODUCT
  // ==============================
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      gameId: true
    },
    orderBy: {
      name: "asc"
    }
  });

  // ==============================
  // AMBIL SEMUA GAME
  // ==============================
  const games = await db.game.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    },
    orderBy: {
      name: "asc"
    }
  });

  console.log("TOTAL PRODUCT DATABASE:", products.length);
  console.log("TOTAL GAME DATABASE:", games.length);
  console.log("");

  // ==============================
  // BUAT MAP GAME
  // ==============================
  const gameMap = new Map(
    games.map(game => [game.id, game])
  );

  // ==============================
  // KELOMPOKKAN PRODUCT PER GAME
  // ==============================
  const result = {};

  for (const product of products) {
    const game = gameMap.get(product.gameId);

    const gameKey = game
      ? game.slug
      : String(product.gameId);

    if (!result[gameKey]) {
      result[gameKey] = {
        gameId: product.gameId,
        gameName: game ? game.name : "UNKNOWN",
        slug: game ? game.slug : null,
        totalProducts: 0,
        products: []
      };
    }

    result[gameKey].totalProducts++;

    result[gameKey].products.push({
      id: product.id,
      name: product.name
    });
  }

  // ==============================
  // TAMPILKAN HASIL
  // ==============================
  for (const [slug, game] of Object.entries(result)) {
    console.log("");
    console.log("========================================");
    console.log("GAME:", game.gameName);
    console.log("SLUG:", slug);
    console.log("GAME ID:", game.gameId);
    console.log("JUMLAH PRODUK:", game.totalProducts);
    console.log("----------------------------------------");

    for (const product of game.products) {
      console.log(
        "-",
        product.name,
        "| ID:",
        product.id
      );
    }
  }

  // ==============================
  // SIMPAN HASIL KE JSON
  // ==============================
  const fs = require("fs");

  fs.writeFileSync(
    "master-product-map.json",
    JSON.stringify(result, null, 2)
  );

  console.log("");
  console.log("========================================");
  console.log("        MASTER MAPPING SELESAI");
  console.log("========================================");
  console.log("");
  console.log("File berhasil dibuat:");
  console.log("master-product-map.json");
  console.log("");
}

// ==============================
// JALANKAN
// ==============================
main()
  .catch(error => {
    console.error("");
    console.error("========================================");
    console.error("ERROR");
    console.error("========================================");
    console.error(error);
    console.error("");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
