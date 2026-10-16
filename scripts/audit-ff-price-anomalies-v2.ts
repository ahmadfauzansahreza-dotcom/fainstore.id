require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function getDiamondNominal(name: string): number | null {
  const match = String(name).match(/(\d+(?:[.,]\d+)?)\s*Diamonds?/i);
  if (!match) return null;

  return Number(match[1].replace(",", "."));
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      status: true,
      deletedAt: null,
      game: {
        name: {
          contains: "Free Fire",
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      name: true,
      priceIdr: true,
      gameId: true,
      categoryId: true,
      slug: true,
    },
    orderBy: {
      priceIdr: "asc",
    },
  });

  /*
   * Baseline kasar berdasarkan harga storefront normal:
   * 50D ≈ 7.5k
   * 140D ≈ 18.8k
   * 720D ≈ 93.9k
   *
   * Kita hanya mencari penyimpangan ekstrem,
   * bukan menentukan harga jual final.
   */

  const suspicious = products
    .map((p) => {
      const nominal = getDiamondNominal(p.name);

      if (!nominal || nominal <= 0) return null;

      // Estimasi kasar harga normal:
      // sekitar Rp130–140 per diamond.
      const expected = nominal * 140;
      const ratio = p.priceIdr / expected;

      return {
        id: p.id,
        name: p.name,
        nominal,
        price: p.priceIdr,
        expectedApprox: Math.round(expected),
        ratio: Number(ratio.toFixed(1)),
        categoryId: p.categoryId,
      };
    })
    .filter(Boolean)
    .filter((p) => p.ratio >= 10);

  console.log("\n========================================");
  console.log("FREE FIRE PRICE ANOMALY AUDIT V2");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.log("\nSUMMARY");

  console.table({
    activeFreeFireProducts: products.length,
    suspiciousExtremePrices: suspicious.length,
  });

  console.log("\n========================================");
  console.log("SUSPICIOUS EXTREME PRICES");
  console.log("========================================");

  console.table(suspicious);

  console.log("\n========================================");
  console.log("FINAL RESULT");
  console.log("========================================");

  if (suspicious.length === 0) {
    console.log("OK: tidak ditemukan harga ekstrem.");
  } else {
    console.log(
      `WARNING: ditemukan ${suspicious.length} produk dengan harga ekstrem.`
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
