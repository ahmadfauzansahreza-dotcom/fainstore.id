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
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      gameId: true,
      categoryId: true,
      priceIdr: true,
      status: true,
      soldCount: true,
      isFeatured: true,
      isBestSeller: true,
      isFlashSale: true,
    },
    orderBy: [
      { gameId: "asc" },
      { categoryId: "asc" },
      { name: "asc" },
      { priceIdr: "asc" },
    ],
  });

  const groups = new Map();

  for (const row of rows) {
    const key = [
      row.gameId,
      row.categoryId,
      row.type,
      row.name.trim().toLowerCase(),
      row.priceIdr,
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(row);
  }

  const duplicates = [];

  for (const [key, items] of groups) {
    if (items.length > 1) {
      duplicates.push({
        key,
        count: items.length,
        products: items.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.priceIdr,
          status: p.status,
          soldCount: p.soldCount,
          featured: p.isFeatured,
          bestSeller: p.isBestSeller,
          flashSale: p.isFlashSale,
        })),
      });
    }
  }

  console.log("\n==========================================");
  console.log("EXACT PRODUCT DUPLICATE AUDIT");
  console.log("==========================================");

  console.log(`Total products : ${rows.length}`);
  console.log(`Duplicate groups : ${duplicates.length}`);

  console.log("\n==========================================");
  console.log("DUPLICATE GROUPS");
  console.log("==========================================");

  for (const group of duplicates) {
    console.log("\n------------------------------------------");

    console.log(`COUNT: ${group.count}`);

    console.table(group.products);
  }

  console.log("\n==========================================");
  console.log("STATUS SUMMARY");
  console.log("==========================================");

  const active = rows.filter((p) => p.status).length;
  const inactive = rows.filter((p) => !p.status).length;

  console.table([
    {
      active,
      inactive,
      total: rows.length,
    },
  ]);

  console.log("\n==========================================");
  console.log("NO DATABASE CHANGES");
  console.log("==========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
