require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
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
    orderBy: {
      name: "asc",
    },
  });

  const missingSlug = products.filter(
    (p) => !p.slug || !String(p.slug).trim()
  );

  const slugMap = new Map();

  for (const p of products) {
    const slug = String(p.slug || "").trim().toLowerCase();

    if (!slug) continue;

    if (!slugMap.has(slug)) {
      slugMap.set(slug, []);
    }

    slugMap.get(slug).push(p);
  }

  const duplicateSlug = [];

  for (const [slug, rows] of slugMap.entries()) {
    if (rows.length > 1) {
      duplicateSlug.push({
        slug,
        count: rows.length,
        products: rows
          .map((p) => `${p.id}:${p.name}`)
          .join(" || "),
      });
    }
  }

  const missingType = products.filter(
    (p) => !p.type || !String(p.type).trim()
  );

  const typeCounts = new Map();

  for (const p of products) {
    const type = String(p.type || "NULL").trim();

    typeCounts.set(
      type,
      (typeCounts.get(type) || 0) + 1
    );
  }

  console.log("\n========================================");
  console.log("ACTIVE STOREFRONT FIELD AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.log("\nSUMMARY");

  console.table({
    activeProducts: products.length,
    missingSlug: missingSlug.length,
    duplicateSlug: duplicateSlug.length,
    missingType: missingType.length,
    uniqueTypes: typeCounts.size,
  });

  console.log("\n========================================");
  console.log("MISSING SLUG");
  console.log("========================================");

  console.table(
    missingSlug.map((p) => ({
      id: p.id,
      name: p.name,
      gameId: p.gameId,
      categoryId: p.categoryId,
    }))
  );

  console.log("\n========================================");
  console.log("DUPLICATE SLUG");
  console.log("========================================");

  console.table(duplicateSlug);

  console.log("\n========================================");
  console.log("MISSING TYPE");
  console.log("========================================");

  console.table(
    missingType.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceIdr: p.priceIdr,
    }))
  );

  console.log("\n========================================");
  console.log("PRODUCT TYPE DISTRIBUTION");
  console.log("========================================");

  console.table(
    [...typeCounts.entries()]
      .map(([type, count]) => ({
        type,
        products: count,
      }))
      .sort((a, b) => b.products - a.products)
  );

  console.log("\n========================================");
  console.log("FINAL RESULT");
  console.log("========================================");

  if (
    missingSlug.length === 0 &&
    duplicateSlug.length === 0 &&
    missingType.length === 0
  ) {
    console.log(
      "OK: seluruh active product siap digunakan di storefront."
    );
  } else {
    console.log(
      "WARNING: ditemukan field storefront yang perlu diperiksa."
    );
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
