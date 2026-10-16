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
      slug: true,
      type: true,
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

  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
