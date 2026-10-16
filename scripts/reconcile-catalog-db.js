require("dotenv/config");

const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const source = JSON.parse(
  fs.readFileSync("catalog-products.json", "utf8")
);

const products = source.allProducts;

async function main() {
  const db = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      priceIdr: true,
      status: true,
      type: true,
    },
  });

  const norm = v =>
    String(v ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const sourceKeys = new Set(
    products.map(p =>
      `${norm(p.name)}|${Number(p.priceIdr ?? p.price ?? p.harga_rupiah ?? 0)}`
    )
  );

  const matched = db.filter(p =>
    sourceKeys.has(
      `${norm(p.name)}|${Number(p.priceIdr)}`
    )
  );

  const extra = db.filter(p =>
    !sourceKeys.has(
      `${norm(p.name)}|${Number(p.priceIdr)}`
    )
  );

  console.log("\n==========================================");
  console.log("CATALOG ↔ DATABASE AUDIT");
  console.log("READ ONLY");
  console.log("==========================================");

  console.table([{
    catalog: products.length,
    database: db.length,
    matched: matched.length,
    extraDatabase: extra.length,
  }]);

  console.log("\nEXTRA DATABASE BY STATUS");

  console.table([
    {
      active: extra.filter(p => p.status).length,
      inactive: extra.filter(p => !p.status).length,
      total: extra.length,
    }
  ]);

  console.log("\nEXTRA DATABASE SAMPLE (20)");

  console.table(
    extra.slice(0, 20).map(p => ({
      name: p.name,
      price: p.priceIdr,
      status: p.status,
      type: p.type,
    }))
  );

  console.log("\n==========================================");
  console.log("NO DATABASE CHANGES");
  console.log("==========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
