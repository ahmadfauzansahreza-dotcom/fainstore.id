require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function rupiah(value: number) {
  return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      status: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      priceIdr: true,
      type: true,
      gameId: true,
      categoryId: true,
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
    orderBy: [
      { gameId: "asc" },
      { categoryId: "asc" },
      { priceIdr: "asc" },
    ],
  });

  const groups = new Map<string, any[]>();

  for (const p of products) {
    const key = [
      p.gameId,
      p.categoryId,
      p.type,
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(p);
  }

  const candidates: any[] = [];

  for (const [, items] of groups) {
    if (items.length < 3) continue;

    const prices = items
      .map((p) => Number(p.priceIdr))
      .filter((p) => Number.isFinite(p) && p > 0)
      .sort((a, b) => a - b);

    if (prices.length < 3) continue;

    const median = prices[Math.floor(prices.length / 2)];

    for (const p of items) {
      const price = Number(p.priceIdr);

      if (!Number.isFinite(price) || price <= 0) continue;

      const ratio = price / median;

      /*
       * Kandidat ekstrem:
       * - > 8x median grup
       * - < 1/8 median grup
       *
       * Ini hanya AUDIT.
       * Tidak ada perubahan database.
       */
      if (ratio >= 8 || ratio <= 0.125) {
        candidates.push({
          id: p.id,
          game: p.game?.name ?? "-",
          category: p.category?.name ?? "-",
          type: p.type,
          name: p.name,
          price: rupiah(price),
          median: rupiah(median),
          ratio: Number(ratio.toFixed(2)),
        });
      }
    }
  }

  console.log("\n========================================");
  console.log("GLOBAL PRICE ANOMALY AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.table({
    activeProducts: products.length,
    groupsChecked: groups.size,
    suspiciousCandidates: candidates.length,
  });

  console.log("\n========================================");
  console.log("SUSPICIOUS PRICE CANDIDATES");
  console.log("========================================");

  if (candidates.length === 0) {
    console.log("OK: tidak ditemukan kandidat harga ekstrem.");
  } else {
    console.table(candidates);
  }

  console.log("\n========================================");
  console.log("FINAL RESULT");
  console.log("========================================");
  console.log("READ ONLY: database tidak diubah.");
}

main()
  .catch((err: any) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
