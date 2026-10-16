import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const targets = [
  [7, "HGDU200X2"],
  [9, "UPMBL296"],

  [32, "HAGO_NEW_KNIGHT"],
  [32, "HAGO_NEW_VISCOUNT"],
  [32, "HAGO_RENEW_KNIGHT"],
  [32, "HAGO_RENEW_VISCOUNT"],
  [32, "NHAGO9200"],
  [32, "NHAGO18200"],
  [32, "NHAGO45600"],
  [32, "NHAGO76200"],
  [32, "NHAGO61K"],
  [32, "NHAGO155K"],

  [106, "GPGANVA"],

  [107, "GPROM72"],
  [107, "GPROM145"],
  [107, "GPROM373"],
  [107, "GPROM748"],

  [132, "DGHMBL875"],
] as const;

console.log("========================================");
console.log("FAIN STORE — V4.8 DATABASE CATEGORY AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

async function main() {
try {
  console.log("");
  console.log("=== GAMES ===");

  const games = await db.game.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  });

  for (const game of games) {
    console.log(
      `game=${game.id} | ${game.name} | slug=${game.slug} | active=${game.isActive}`
    );
  }

  console.log("");
  console.log("=== CATEGORIES ===");

  const categories = await db.category.findMany({
    orderBy: [
      { gameId: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      gameId: true,
    },
  });

  for (const category of categories) {
    console.log(
      `category=${category.id} | gameId=${category.gameId} | name=${category.name} | slug=${category.slug}`
    );
  }

  console.log("");
  console.log("=== V4.5 TARGET PRODUCTS ===");

  for (const [operatorId, code] of targets) {
    const products = await db.product.findMany({
      where: {
        slug: {
          contains: code,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        gameId: true,
        categoryId: true,
        status: true,
        deletedAt: true,
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            gameId: true,
          },
        },
      },
    });

    console.log("");
    console.log(
      `TARGET operator=${operatorId} | code=${code} | matches=${products.length}`
    );

    for (const product of products) {
      console.log(
        JSON.stringify(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            type: product.type,
            gameId: product.gameId,
            game: product.game,
            categoryId: product.categoryId,
            category: product.category,
            status: product.status,
            deletedAt: product.deletedAt,
          },
          null,
          2
        )
      );
    }
  }

  console.log("");
  console.log("========================================");
  console.log("V4.8 DATABASE CATEGORY AUDIT SELESAI");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
} finally {
  await db.$disconnect();
}

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
