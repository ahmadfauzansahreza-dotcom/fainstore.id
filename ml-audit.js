require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
});

async function main() {
  const game = await db.game.findFirst({
    where: { slug: "mobile-legend" }
  });

  if (!game) throw new Error("Mobile Legends tidak ditemukan");

  const products = await db.product.findMany({
    where: { gameId: game.id },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      priceIdr: true,
      categoryId: true
    },
    orderBy: { name: "asc" }
  });

  console.log(JSON.stringify(products, null, 2));
  console.log("TOTAL:", products.length);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
