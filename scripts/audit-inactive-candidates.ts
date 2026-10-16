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
    orderBy: {
      name: "asc",
    },
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

  const rows = [];

  for (const oldProduct of inactive) {
    const candidates = active.filter(
      (p) =>
        p.gameId === oldProduct.gameId &&
        p.categoryId === oldProduct.categoryId &&
        p.type === oldProduct.type
    );

    const normalizedOld = normalize(oldProduct.name);

    const nameMatches = candidates.filter((p) => {
      const normalizedNew = normalize(p.name);

      return (
        normalizedNew === normalizedOld ||
        normalizedNew.includes(normalizedOld) ||
        normalizedOld.includes(normalizedNew)
      );
    });

    rows.push({
      inactiveId: oldProduct.id,
      inactiveName: oldProduct.name,
      inactivePrice: oldProduct.priceIdr,
      candidateCount: candidates.length,
      nameMatchCount: nameMatches.length,
      activeMatches: nameMatches
        .map((p) => `${p.name} [Rp${p.priceIdr}]`)
        .join(" || "),
    });
  }

  console.log("\n==========================================");
  console.log("INACTIVE PRODUCT CANDIDATE AUDIT");
  console.log("==========================================");

  console.log(`Inactive products : ${inactive.length}`);

  console.log(
    `With same game/category/type : ${
      rows.filter((r) => r.candidateCount > 0).length
    }`
  );

  console.log(
    `With name match : ${
      rows.filter((r) => r.nameMatchCount > 0).length
    }`
  );

  console.log(
    `Without any active candidate : ${
      rows.filter((r) => r.candidateCount === 0).length
    }`
  );

  console.log("\n==========================================");
  console.log("NAME MATCHES");
  console.log("==========================================");

  console.table(
    rows
      .filter((r) => r.nameMatchCount > 0)
      .map((r) => ({
        inactive: r.inactiveName,
        inactivePrice: r.inactivePrice,
        activeMatches: r.activeMatches,
      }))
  );

  console.log("\n==========================================");
  console.log("SAME CATEGORY BUT NO NAME MATCH");
  console.log("==========================================");

  console.table(
    rows
      .filter(
        (r) =>
          r.candidateCount > 0 &&
          r.nameMatchCount === 0
      )
      .map((r) => ({
        inactive: r.inactiveName,
        inactivePrice: r.inactivePrice,
        candidates: r.candidateCount,
      }))
  );

  console.log("\n==========================================");
  console.log("NO ACTIVE CANDIDATE");
  console.log("==========================================");

  console.table(
    rows
      .filter((r) => r.candidateCount === 0)
      .map((r) => ({
        inactive: r.inactiveName,
        inactivePrice: r.inactivePrice,
      }))
  );

  console.log("\n==========================================");
  console.log("NO DATABASE CHANGES");
  console.log("==========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
