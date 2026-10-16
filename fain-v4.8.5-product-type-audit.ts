import { db } from "./src/lib/db";

async function main() {
  console.log("========================================");
  console.log("FAIN STORE — V4.8.5 PRODUCT TYPE AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  const total = await db.product.count();

  const topup = await db.product.count({
    where: {
      type: "TOPUP",
    },
  });

  const gameAccount = await db.product.count({
    where: {
      type: "GAME_ACCOUNT",
    },
  });

  const topupWithGame = await db.product.count({
    where: {
      type: "TOPUP",
      gameId: {
        not: "",
      },
    },
  });

  const topupWithCategory = await db.product.count({
    where: {
      type: "TOPUP",
      categoryId: {
        not: null,
      },
    },
  });

  const accountWithGame = await db.product.count({
    where: {
      type: "GAME_ACCOUNT",
      gameId: {
        not: "",
      },
    },
  });

  const accountWithCategory = await db.product.count({
    where: {
      type: "GAME_ACCOUNT",
      categoryId: {
        not: null,
      },
    },
  });

  console.log("");
  console.log("=== PRODUCT TYPES ===");
  console.log("TOTAL PRODUCTS       :", total);
  console.log("TOPUP                :", topup);
  console.log("GAME_ACCOUNT         :", gameAccount);

  console.log("");
  console.log("=== TOPUP RELATIONS ===");
  console.log("TOPUP WITH GAME      :", topupWithGame);
  console.log("TOPUP WITH CATEGORY  :", topupWithCategory);

  console.log("");
  console.log("=== GAME ACCOUNT RELATIONS ===");
  console.log("ACCOUNT WITH GAME    :", accountWithGame);
  console.log("ACCOUNT WITH CATEGORY:", accountWithCategory);

  console.log("");
  console.log("=== SAMPLE GAME ACCOUNT ===");

  const accounts = await db.product.findMany({
    where: {
      type: "GAME_ACCOUNT",
      deletedAt: null,
    },
    select: {
      name: true,
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

  if (accounts.length === 0) {
    console.log("NO GAME_ACCOUNT PRODUCT FOUND");
  } else {
    for (const p of accounts) {
      console.log(
        `GAME_ACCOUNT | ${p.name} | GAME=${p.game?.name ?? "NULL"} | CATEGORY=${p.category?.name ?? "NULL"}`
      );
    }
  }

  console.log("");
  console.log("=== AUDIT ===");

  console.log(
    "CATEGORY TABLE EMPTY :",
    (await db.category.count()) === 0 ? "CONFIRMED" : "NO"
  );

  console.log("");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("PRODUCT TYPE AUDIT : FAIL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
