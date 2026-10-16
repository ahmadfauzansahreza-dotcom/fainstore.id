require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNominal(name) {
  const matches = String(name || "").match(/\d+(?:[.,]\d+)?/g);
  return matches ? matches.join("|") : "";
}

async function main() {
  const inactive = await prisma.product.findMany({
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

  const active = await prisma.product.findMany({
    where: {
      status: true,
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
  });

  const activeMap = new Map();

  for (const p of active) {
    const key =
      `${p.gameId}|${p.categoryId}|${normalize(p.name)}|${getNominal(p.name)}`;

    if (!activeMap.has(key)) activeMap.set(key, []);
    activeMap.get(key).push(p);
  }

  const rows = inactive.map((p) => {
    const key =
      `${p.gameId}|${p.categoryId}|${normalize(p.name)}|${getNominal(p.name)}`;

    const matches = activeMap.get(key) || [];

    return {
      inactiveId: p.id,
      name: p.name,
      type: p.type,
      gameId: p.gameId,
      categoryId: p.categoryId,
      inactivePrice: p.priceIdr,
      activeMatchCount: matches.length,
      activeMatches: matches
        .map((m) => `${m.id}:${m.name}:${m.priceIdr}`)
        .join(" || "),
    };
  });

  const summary = {
    inactiveTotal: rows.length,
    withActiveMatch: rows.filter((r) => r.activeMatchCount > 0).length,
    withoutActiveMatch: rows.filter((r) => r.activeMatchCount === 0).length,
  };

  console.log("\n========================================");
  console.log("INACTIVE → ACTIVE CROSS-BATCH AUDIT");
  console.log("========================================");
  console.table(summary);

  console.log("\n========================================");
  console.log("MATCHED INACTIVE PRODUCTS");
  console.log("========================================");

  console.table(
    rows
      .filter((r) => r.activeMatchCount > 0)
      .map((r) => ({
        name: r.name,
        inactivePrice: r.inactivePrice,
        activeMatches: r.activeMatches,
      }))
  );

  console.log("\n========================================");
  console.log("UNMATCHED INACTIVE PRODUCTS");
  console.log("========================================");

  console.table(
    rows
      .filter((r) => r.activeMatchCount === 0)
      .map((r) => ({
        name: r.name,
        inactivePrice: r.inactivePrice,
        gameId: r.gameId,
        categoryId: r.categoryId,
      }))
  );

  console.log("\n========================================");
  console.log("NO DATABASE CHANGES");
  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
