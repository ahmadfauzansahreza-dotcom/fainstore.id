import { db } from "./src/lib/db";

async function main() {
  console.log("========================================");
  console.log("FAIN STORE — V4.8.4 RELATION AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  const games = await db.game.count();
  const categories = await db.category.count();
  const products = await db.product.count();

  const orphanProducts = await db.product.count({
    where: {
      category: {
        is: null,
      },
    },
  });

  const topupWithoutCategory = await db.product.count({
    where: {
      type: "TOPUP",
      categoryId: null,
    },
  });

  const categoryWithoutGame = await db.category.count({
    where: {
      gameId: "",
    },
  });

  const productsWithDeletedAt = await db.product.count({
    where: {
      deletedAt: {
        not: null,
      },
    },
  });

  console.log("");
  console.log("=== COUNTS ===");
  console.log("GAMES              :", games);
  console.log("CATEGORIES         :", categories);
  console.log("PRODUCTS           :", products);
  console.log("ORPHAN PRODUCTS    :", orphanProducts);
  console.log("TOPUP NO CATEGORY  :", topupWithoutCategory);
  console.log("CATEGORY NO GAME   :", categoryWithoutGame);
  console.log("DELETED PRODUCTS   :", productsWithDeletedAt);

  console.log("");
  console.log("=== PRODUCT RELATION SAMPLE ===");

  const sample = await db.product.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      game: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    take: 10,
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const p of sample) {
    console.log(
      `${p.type} | ${p.name} | GAME=${p.game?.name ?? "NULL"} | CATEGORY=${p.category?.name ?? "NULL"}`
    );
  }

  console.log("");
  console.log("=== AUDIT RESULT ===");

  const relationPass =
    orphanProducts === 0 &&
    topupWithoutCategory === 0 &&
    categoryWithoutGame === 0;

  console.log(
    "RELATION INTEGRITY :",
    relationPass ? "PASS" : "REVIEW REQUIRED"
  );

  console.log("");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("RELATION AUDIT : FAIL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
