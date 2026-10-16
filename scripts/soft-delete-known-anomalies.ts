require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const targets = [
  { code: "FF330", name: "330 Diamond Free Fire", price: 75852 },
  { code: "FF335", name: "335 Diamond Free Fire", price: 41022 },
  { code: "FF1125", name: "1125 Diamond Free Fire", price: 260838 },
  { code: "FF1145", name: "1145 Diamond Free Fire", price: 136224 },
];

async function main() {
  console.log("\n========================================");
  console.log("SOFT DELETE KNOWN ANOMALOUS PRODUCTS");
  console.log("========================================\n");

  const results = [];

  for (const target of targets) {
    const products = await prisma.product.findMany({
      where: {
        status: true,
        deletedAt: null,
        name: target.name,
        priceIdr: target.price,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        priceIdr: true,
        gameId: true,
        categoryId: true,
        status: true,
        deletedAt: true,
      },
    });

    if (products.length === 0) {
      results.push({
        code: target.code,
        name: target.name,
        price: target.price,
        found: 0,
        action: "NOT_FOUND",
      });
      continue;
    }

    for (const product of products) {
      await prisma.product.update({
        where: {
          id: product.id,
        },
        data: {
          status: false,
          deletedAt: new Date(),
        },
      });

      results.push({
        code: target.code,
        name: product.name,
        price: product.priceIdr,
        id: product.id,
        action: "SOFT_DELETED",
      });
    }
  }

  console.table(results);

  console.log("\n========================================");
  console.log("VERIFICATION");
  console.log("========================================\n");

  const remaining = await prisma.product.findMany({
    where: {
      status: true,
      deletedAt: null,
      OR: targets.map((target) => ({
        name: target.name,
        priceIdr: target.price,
      })),
    },
    select: {
      id: true,
      name: true,
      priceIdr: true,
      status: true,
    },
  });

  console.table(remaining);

  if (remaining.length === 0) {
    console.log("OK: seluruh target anomaly sudah tidak aktif.");
  } else {
    console.log(
      `WARNING: masih ada ${remaining.length} target anomaly yang aktif.`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
