require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      status: false,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      gameId: true,
      categoryId: true,
      priceIdr: true,
      soldCount: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const groups = new Map();

  for (const p of rows) {
    const key = `${p.gameId}|${p.categoryId}|${p.type}`;

    if (!groups.has(key)) {
      groups.set(key, {
        gameId: p.gameId,
        categoryId: p.categoryId,
        type: p.type,
        count: 0,
        products: [],
      });
    }

    const g = groups.get(key);

    g.count++;

    g.products.push({
      name: p.name,
      price: p.priceIdr,
      sold: p.soldCount,
    });
  }

  console.log("\n==========================================");
  console.log("INACTIVE PRODUCT SUMMARY");
  console.log("==========================================");

  console.log(`Total inactive: ${rows.length}`);

  console.log("\n==========================================");
  console.log("GROUP BY GAME + CATEGORY + TYPE");
  console.log("==========================================");

  console.table(
    [...groups.values()]
      .sort((a, b) => b.count - a.count)
      .map((g) => ({
        gameId: g.gameId,
        categoryId: g.categoryId,
        type: g.type,
        inactiveCount: g.count,
      }))
  );

  console.log("\n==========================================");
  console.log("ALL INACTIVE PRODUCTS");
  console.log("==========================================");

  console.table(
    rows.map((p, i) => ({
      no: i + 1,
      name: p.name,
      type: p.type,
      price: p.priceIdr,
      sold: p.soldCount,
      gameId: p.gameId,
      categoryId: p.categoryId,
    }))
  );

  console.log("\n==========================================");
  console.log("NO DATABASE CHANGES");
  console.log("==========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
