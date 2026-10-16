require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.product.groupBy({
    by: ["gameId", "categoryId"],
    where: {
      status: false,
      deletedAt: null,
    },
    _count: {
      _all: true,
    },
  });

  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
