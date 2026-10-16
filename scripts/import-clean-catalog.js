require("dotenv/config");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const slugify = v =>
  String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function categoryName(p) {
  const n = String(p.name || "").toLowerCase();

  if (p.game === "free-fire") {
    if (n.includes("bp card")) return "BP Card";
    if (n.includes("membership") || n.includes("bulanan") || n.includes("mingguan"))
      return "Membership";
  }

  if (p.classification === "SPECIAL") return "Special Items";
  if (p.classification === "VOUCHER") return "Voucher";
  if (p.classification === "SERVICE") return "Service";

  return "Top Up Instant";
}

(async () => {
  try {
    const catalog = JSON.parse(
      fs.readFileSync("catalog-products.json", "utf8")
    ).allProducts;

    const products = catalog.filter(p => String(p.game || "").trim());

    const games = await prisma.game.findMany({
      select: { id: true, slug: true, name: true }
    });

    const gameMap = new Map(games.map(g => [g.slug, g]));

    const categories = await prisma.category.findMany({
      select: { id: true, gameId: true, name: true, slug: true }
    });

    const categoryMap = new Map(
      categories.map(c => [`${c.gameId}|${c.name.toLowerCase()}`, c])
    );

    const rows = [];

    for (const p of products) {
      const game = gameMap.get(p.game);
      if (!game) throw new Error(`Game tidak ditemukan: ${p.game}`);

      const cname = categoryName(p);
      const category = categoryMap.get(
        `${game.id}|${cname.toLowerCase()}`
      );

      if (!category) {
        throw new Error(
          `Category tidak ditemukan: ${game.name} -> ${cname} -> ${p.name}`
        );
      }

      rows.push({
        name: p.name,
        slug: `provider-${slugify(p.sourceCode)}`,
        type: "TOPUP",
        gameId: game.id,
        categoryId: category.id,
        description: null,
        specifications: {
          sourceCode: p.sourceCode,
          operatorId: p.operatorId,
          sourceName: p.sourceName,
          active: p.active,
          classification: p.classification,
          mappingConfidence: p.mappingConfidence,
          mappingReason: p.mappingReason
        },
        priceIdr: Number(p.priceIdr),
        stockQty: 0,
        status: Boolean(p.active),
        isDemo: false
      });
    }

    const codes = new Set(products.map(p => p.sourceCode));
    if (codes.size !== products.length) {
      throw new Error("sourceCode duplicate terdeteksi.");
    }

    const result = await prisma.$transaction(
      async tx => {
        return tx.product.createMany({
          data: rows,
          skipDuplicates: false
        });
      },
      { timeout: 120000 }
    );

    const total = await prisma.product.count();

    console.log("================================");
    console.log("CLEAN CATALOG IMPORT");
    console.log("================================");
    console.log("SOURCE        :", catalog.length);
    console.log("IMPORTED      :", result.count);
    console.log("GLOBAL SKIP   :", catalog.length - products.length);
    console.log("DATABASE TOTAL:", total);
    console.log("================================");
    console.log("IMPORT BERHASIL");
    console.log("================================");

  } catch (e) {
    console.error("IMPORT GAGAL");
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
