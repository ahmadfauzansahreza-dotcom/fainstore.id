require("dotenv/config");

const fs = require("fs");
const path = require("path");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const JSON_FILE = path.join(
  process.cwd(),
  "data-produk-10-08-26(20260819-092444).json"
);

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function makeSlug(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("==========================================");
  console.log("FAIN STORE — PRODUCT RECONCILIATION");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("==========================================");
  console.log("");

  if (!fs.existsSync(JSON_FILE)) {
    throw new Error(`File JSON tidak ditemukan:\n${JSON_FILE}`);
  }

  const raw = fs.readFileSync(JSON_FILE, "utf8");
  const source = JSON.parse(raw);

  if (!Array.isArray(source)) {
    throw new Error("Format JSON bukan array produk.");
  }

  console.log(`SOURCE JSON : ${source.length} produk`);
  console.log("");

  // --------------------------------------------------
  // SOURCE INDEX
  // --------------------------------------------------

  const sourceByCode = new Map();
  const sourceBySlug = new Map();

  const duplicateCodes = [];
  const duplicateSlugs = [];

  for (const item of source) {
    const code = normalize(
      item.kode_produk ??
      item.code ??
      item.product_code
    );

    const name = String(
      item.nama ??
      item.name ??
      ""
    ).trim();

    const slug = makeSlug(code || name);

    if (code) {
      if (sourceByCode.has(code)) {
        duplicateCodes.push(code);
      }

      sourceByCode.set(code, item);
    }

    if (slug) {
      if (sourceBySlug.has(slug)) {
        duplicateSlugs.push(slug);
      }

      sourceBySlug.set(slug, item);
    }
  }

  // --------------------------------------------------
  // DATABASE READ
  // --------------------------------------------------

  const products = await prisma.product.findMany({
    where: {
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
      status: true,
      isDemo: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`DATABASE    : ${products.length} produk`);
  console.log("");

  // --------------------------------------------------
  // DATABASE INDEX
  // --------------------------------------------------

  const dbBySlug = new Map();

  for (const product of products) {
    const slug = normalize(product.slug);

    if (slug) {
      dbBySlug.set(slug, product);
    }
  }

  // --------------------------------------------------
  // MATCH SOURCE -> DATABASE
  // --------------------------------------------------

  const matched = [];
  const missingInDb = [];
  const priceMismatch = [];
  const statusMismatch = [];

  for (const item of source) {
    const code = normalize(
      item.kode_produk ??
      item.code ??
      item.product_code
    );

    const name = String(
      item.nama ??
      item.name ??
      ""
    ).trim();

    const sourcePrice =
      Number(
        item.harga_rupiah ??
        item.priceIdr ??
        item.price ??
        0
      );

    const sourceStatus = normalize(item.status);

    const expectedSlug = makeSlug(code || name);

    const dbProduct = dbBySlug.get(expectedSlug);

    if (!dbProduct) {
      missingInDb.push({
        code,
        name,
        sourcePrice,
        sourceStatus,
        expectedSlug,
      });

      continue;
    }

    matched.push({
      code,
      name,
      sourcePrice,
      sourceStatus,
      dbId: dbProduct.id,
      dbName: dbProduct.name,
      dbSlug: dbProduct.slug,
      dbPrice: dbProduct.priceIdr,
      dbStatus: dbProduct.status,
    });

    if (
      sourcePrice > 0 &&
      Number(dbProduct.priceIdr) !== sourcePrice
    ) {
      priceMismatch.push({
        code,
        name,
        sourcePrice,
        dbPrice: dbProduct.priceIdr,
        difference:
          Number(dbProduct.priceIdr) - sourcePrice,
      });
    }

    const expectedActive =
      sourceStatus === "aktif"
        ? true
        : sourceStatus === "non-aktif"
          ? false
          : null;

    if (
      expectedActive !== null &&
      Boolean(dbProduct.status) !== expectedActive
    ) {
      statusMismatch.push({
        code,
        name,
        sourceStatus,
        dbStatus: dbProduct.status,
      });
    }
  }

  // --------------------------------------------------
  // DATABASE EXTRA
  // --------------------------------------------------

  const extraInDb = [];

  for (const product of products) {
    const slug = normalize(product.slug);

    if (!sourceBySlug.has(slug)) {
      extraInDb.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        gameId: product.gameId,
        categoryId: product.categoryId,
        priceIdr: product.priceIdr,
        status: product.status,
        isDemo: product.isDemo,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    }
  }

  // --------------------------------------------------
  // DEMO / NON-DEMO
  // --------------------------------------------------

  const demoProducts = products.filter(
    (p) => p.isDemo === true
  );

  const nonDemoProducts = products.filter(
    (p) => p.isDemo === false
  );

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  const dbActive = products.filter(
    (p) => p.status === true
  ).length;

  const dbInactive = products.filter(
    (p) => p.status === false
  ).length;

  // --------------------------------------------------
  // REPORT
  // --------------------------------------------------

  console.log("==========================================");
  console.log("SUMMARY");
  console.log("==========================================");

  console.table([
    {
      sourceJson: source.length,
      database: products.length,
      matched: matched.length,
      missingInDb: missingInDb.length,
      extraInDb: extraInDb.length,
      priceMismatch: priceMismatch.length,
      statusMismatch: statusMismatch.length,
    },
  ]);

  console.log("");

  console.log("DATABASE STATUS");
  console.table([
    {
      active: dbActive,
      inactive: dbInactive,
      total: products.length,
    },
  ]);

  console.log("");

  console.log("DEMO STATUS");
  console.table([
    {
      demo: demoProducts.length,
      nonDemo: nonDemoProducts.length,
      total: products.length,
    },
  ]);

  console.log("");

  console.log("SOURCE DUPLICATES");
  console.table([
    {
      duplicateCodes: duplicateCodes.length,
      duplicateSlugs: duplicateSlugs.length,
    },
  ]);

  // --------------------------------------------------
  // EXTRA DATABASE PRODUCTS
  // --------------------------------------------------

  console.log("");
  console.log("==========================================");
  console.log("EXTRA PRODUCTS IN DATABASE");
  console.log("==========================================");

  if (extraInDb.length === 0) {
    console.log("Tidak ada produk tambahan di database.");
  } else {
    console.table(
      extraInDb.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceIdr: p.priceIdr,
        status: p.status,
        isDemo: p.isDemo,
      }))
    );
  }

  // --------------------------------------------------
  // MISSING DATABASE PRODUCTS
  // --------------------------------------------------

  console.log("");
  console.log("==========================================");
  console.log("SOURCE PRODUCTS MISSING IN DATABASE");
  console.log("==========================================");

  if (missingInDb.length === 0) {
    console.log("Semua produk source ditemukan di database.");
  } else {
    console.table(missingInDb);
  }

  // --------------------------------------------------
  // PRICE MISMATCH
  // --------------------------------------------------

  console.log("");
  console.log("==========================================");
  console.log("PRICE MISMATCH");
  console.log("==========================================");

  if (priceMismatch.length === 0) {
    console.log("Tidak ada perbedaan harga.");
  } else {
    console.table(priceMismatch);
  }

  // --------------------------------------------------
  // STATUS MISMATCH
  // --------------------------------------------------

  console.log("");
  console.log("==========================================");
  console.log("STATUS MISMATCH");
  console.log("==========================================");

  if (statusMismatch.length === 0) {
    console.log("Tidak ada perbedaan status.");
  } else {
    console.table(statusMismatch);
  }

  // --------------------------------------------------
  // SAVE MACHINE-READABLE REPORT
  // --------------------------------------------------

  const report = {
    generatedAt: new Date().toISOString(),

    source: {
      total: source.length,
      duplicateCodes: duplicateCodes.length,
      duplicateSlugs: duplicateSlugs.length,
    },

    database: {
      total: products.length,
      active: dbActive,
      inactive: dbInactive,
      demo: demoProducts.length,
      nonDemo: nonDemoProducts.length,
    },

    reconciliation: {
      matched: matched.length,
      missingInDb: missingInDb.length,
      extraInDb: extraInDb.length,
      priceMismatch: priceMismatch.length,
      statusMismatch: statusMismatch.length,
    },

    duplicateCodes,
    duplicateSlugs,
    missingInDb,
    extraInDb,
    priceMismatch,
    statusMismatch,
  };

  const reportPath = path.join(
    process.cwd(),
    "product-reconciliation-report.json"
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("==========================================");
  console.log("REPORT SAVED");
  console.log("==========================================");
  console.log(reportPath);
  console.log("");
  console.log("NO DATABASE CHANGES");
}

main()
  .catch((error) => {
    console.error("");
    console.error("AUDIT ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
