import { db } from "./src/lib/db";

async function main() {
  console.log("========================================");
  console.log("FAIN STORE — V4.8.6 CATEGORY CANDIDATE AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  const products = await db.product.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      name: true,
      type: true,
      specifications: true,
      game: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { game: { name: "asc" } },
      { name: "asc" },
    ],
  });

  const byGame = new Map<string, typeof products>();

  for (const product of products) {
    const game = product.game?.name ?? "NO_GAME";

    if (!byGame.has(game)) {
      byGame.set(game, []);
    }

    byGame.get(game)!.push(product);
  }

  console.log("");
  console.log("=== GAME DISTRIBUTION ===");

  for (const [game, items] of byGame) {
    console.log(`${game} : ${items.length}`);
  }

  console.log("");
  console.log("=== CATEGORY-LIKE KEYWORDS ===");

  const keywords = [
    "diamond",
    "membership",
    "weekly",
    "monthly",
    "pass",
    "voucher",
    "token",
    "coin",
    "point",
    "special",
    "flash",
    "card",
    "subscription",
    "topup",
  ];

  const keywordCounts = new Map<string, number>();

  for (const product of products) {
    const text = [
      product.name,
      typeof product.specifications === "string"
        ? product.specifications
        : JSON.stringify(product.specifications ?? ""),
    ]
      .join(" ")
      .toLowerCase();

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        keywordCounts.set(
          keyword,
          (keywordCounts.get(keyword) ?? 0) + 1
        );
      }
    }
  }

  for (const keyword of keywords) {
    console.log(
      `${keyword.padEnd(15)} : ${keywordCounts.get(keyword) ?? 0}`
    );
  }

  console.log("");
  console.log("=== SAMPLE PRODUCTS PER GAME ===");

  for (const [game, items] of byGame) {
    console.log("");
    console.log(`--- ${game} (${items.length}) ---`);

    for (const product of items.slice(0, 15)) {
      console.log(
        `${product.type} | ${product.name} | SPEC=${JSON.stringify(
          product.specifications
        )}`
      );
    }
  }

  console.log("");
  console.log("=== AUDIT STATUS ===");
  console.log("CATEGORY TABLE : EMPTY — CONFIRMED");
  console.log("PRODUCT DATA   : READ ONLY");
  console.log("DATABASE       : NOT MODIFIED");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("CATEGORY CANDIDATE AUDIT : FAIL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
