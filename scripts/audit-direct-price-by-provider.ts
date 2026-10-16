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

function getProvider(name) {
  const value = String(name || "").toLowerCase();

  if (value.includes("unipin")) return "UNIPIN";
  if (value.includes("dgr")) return "DGR";
  if (value.includes("dgh")) return "DGH";
  if (value.includes("dghf")) return "DGHF";

  return "DIRECT";
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
    },
    select: {
      id: true,
      name: true,
      slug: true,
      priceIdr: true,
      categoryId: true,
    },
  });

  const groups = new Map();

  for (const p of products) {
    const nominal = getNominal(p.name);
    if (nominal === null) continue;

    const provider = getProvider(p.name);
    const key = `${p.categoryId}|${provider}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push({
      ...p,
      nominal,
      provider,
    });
  }

  let totalProducts = 0;
  let totalViolations = 0;

  console.log("\n========================================");
  console.log("DIRECT PRICE BY PROVIDER AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================\n");

  for (const [key, rows] of groups) {
    rows.sort((a, b) => {
      if (a.nominal !== b.nominal) {
        return a.nominal - b.nominal;
      }

      return a.priceIdr - b.priceIdr;
    });

    totalProducts += rows.length;

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

    if (violations.length > 0) {
      totalViolations += violations.length;

      console.log(`\nGROUP: ${key}`);
      console.log(`PRODUCTS: ${rows.length}`);
      console.log(`VIOLATIONS: ${violations.length}`);
      console.table(violations);
    }
  }

  console.log("\n========================================");
  console.log("FINAL SUMMARY");
  console.log("========================================");
  console.log(`ACTIVE FF TOPUP PRODUCTS : ${totalProducts}`);
  console.log(`PRICE VIOLATIONS         : ${totalViolations}`);

  if (totalViolations === 0) {
    console.log("\nOK: NO WITHIN-PROVIDER PRICE VIOLATIONS");
  } else {
    console.log(
      "\nWARNING: violations remain, but they are now isolated per provider."
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
