require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const targets = [
  "Hago Bangsawan Inquiry",
  "Hago Diamond Inquiry",
];

async function main() {
  console.log("========================================");
  console.log("SOFT DELETE HAGO INVALID PRICE");
  console.log("========================================");

  const products = await prisma.product.findMany({
    where: {
      name: { in: targets },
      priceIdr: 0,
      status: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      priceIdr: true,
    },
  });

  console.table(products);

  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        status: false,
        deletedAt: new Date(),
      },
    });

    console.log(`SOFT_DELETED: ${product.name}`);
  }

  console.log("\n========================================");
  console.log("VERIFICATION");
  console.log("========================================");

  const remaining = await prisma.product.findMany({
    where: {
      name: { in: targets },
      priceIdr: 0,
      status: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      priceIdr: true,
    },
  });

  console.table(remaining);

  if (remaining.length === 0) {
    console.log("OK: seluruh produk Hago harga Rp0 sudah tidak aktif.");
  } else {
    console.log(`WARNING: masih ada ${remaining.length} produk yang aktif.`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
