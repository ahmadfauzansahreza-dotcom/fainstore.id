require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function getNominal(name) {
  const matches = String(name || "").match(/\d+(?:[.,]\d+)?/g);
  return matches ? Number(matches[0].replace(/[.,]/g, "")) : null;
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      status: true,
      deletedAt: null,
      type: "TOPUP",
      game: {
        name: "Free Fire",
      },
      category: {
        name: "Top Up Instant",
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      priceIdr: true,
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
  });

  const rows = products
    .map((p) => ({
      ...p,
      nominal: getNominal(p.name),
    }))
    .filter((p) => p.nominal !== null)
    .sort((a, b) => {
      if (a.nominal !== b.nominal) return a.nominal - b.nominal;
      return a.priceIdr - b.priceIdr;
    });

  const violations = [];

  for (let i = 1; i < rows.length; i++) {
    const previous = rows[i - 1];
    const current = rows[i];

    if (
      current.nominal > previous.nominal &&
      current.priceIdr < previous.priceIdr
    ) {
      violations.push({
        previous: `${previous.name} | Rp${previous.priceIdr}`,
        current: `${current.name} | Rp${current.priceIdr}`,
        drop: previous.priceIdr - current.priceIdr,
      });
    }
  }

  console.log("\n================================");
  console.log("DIRECT PRICE MONOTONICITY AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("================================");

  console.log(`DIRECT PRODUCTS : ${rows.length}`);
  console.log(`PRICE VIOLATIONS: ${violations.length}`);

  if (violations.length > 0) {
    console.table(violations);
  } else {
    console.log("\nOK: NO PRICE MONOTONICITY VIOLATIONS");
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
