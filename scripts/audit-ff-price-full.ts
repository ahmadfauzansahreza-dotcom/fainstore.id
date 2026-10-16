require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function extractNominal(name: string): number | null {
  const text = String(name || "");

  // Tangkap bentuk utama seperti:
  // 5 Diamond
  // 50 Diamonds
  // 140 Diamond
  // 720 Diamond
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*Diamonds?/i);

  if (!match) return null;

  const value = Number(match[1].replace(",", "."));

  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractFamily(name: string): string {
  const text = String(name || "").toUpperCase();

  if (/\bDGHF?\b/.test(text)) return "DGH/DGHF";
  if (/\bDGR\b/.test(text)) return "DGR";
  if (/\bUNIPIN\b/.test(text)) return "UNIPIN";
  if (/\bDG\b/.test(text)) return "DG";

  return "NORMAL/OTHER";
}

function formatRupiah(value: number) {
  return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
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
      slug: true,
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
      { categoryId: "asc" },
      { priceIdr: "asc" },
      { name: "asc" },
    ],
  });

  const rows = products.map((p: any, index: number) => {
    const family = extractFamily(p.name);

    // Paket bonus FF seperti "512+3" dan "925 + 5"
    // harus dihitung sebagai total nominal, bukan angka bonusnya.
    let nominal = extractNominal(p.name);

    const bonusMatch = String(p.name).match(
      /^(\d+(?:[.,]\d+)?)\s*\+\s*(\d+(?:[.,]\d+)?)\s+Diamond/i
    );

    if (bonusMatch) {
      nominal =
        Number(bonusMatch[1].replace(",", ".")) +
        Number(bonusMatch[2].replace(",", "."));
    }

    const pricePerNominal =
      nominal && nominal > 0
        ? Math.round(p.priceIdr / nominal)
        : null;

    let recommendation = "REVIEW";
    let reason = "Perlu pemeriksaan manual";

    /*
     * IMPORTANT:
     * Belum ada auto-delete.
     * Kandidat ekstrem hanya ditandai.
     *
     * Threshold ini sengaja konservatif.
     */
    if (
      nominal &&
      nominal > 0 &&
      p.priceIdr > nominal * 1000
    ) {
      recommendation = "SOFT_DELETE_CANDIDATE";
      reason = "Harga > Rp1.000 per nominal";
    }

    return {
      index: index + 1,
      id: p.id,
      name: p.name,
      nominal,
      price: p.priceIdr,
      pricePerNominal,
      game: p.game?.name ?? null,
      category: p.category?.name ?? null,
      family,
      recommendation,
      reason,
    };
  });

  console.log("\n========================================");
  console.log("FREE FIRE FULL PRICE AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.log("\nSUMMARY");
  console.table({
    activeFreeFireProducts: rows.length,
    keep: rows.filter(
      (r: any) => r.recommendation === "KEEP"
    ).length,
    review: rows.filter(
      (r: any) => r.recommendation === "REVIEW"
    ).length,
    softDeleteCandidates: rows.filter(
      (r: any) =>
        r.recommendation === "SOFT_DELETE_CANDIDATE"
    ).length,
  });

  console.log("\n========================================");
  console.log("ALL ACTIVE FREE FIRE PRODUCTS");
  console.log("========================================");

  console.table(
    rows.map((r: any) => ({
      "#": r.index,
      name: r.name,
      nominal: r.nominal,
      price: formatRupiah(r.price),
      pricePerNominal: r.pricePerNominal
        ? formatRupiah(r.pricePerNominal)
        : "-",
      category: r.category,
      family: r.family,
      recommendation: r.recommendation,
    }))
  );

  console.log("\n========================================");
  console.log("SOFT DELETE CANDIDATES");
  console.log("========================================");

  console.table(
    rows
      .filter(
        (r: any) =>
          r.recommendation === "SOFT_DELETE_CANDIDATE"
      )
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        nominal: r.nominal,
        price: formatRupiah(r.price),
        pricePerNominal: r.pricePerNominal
          ? formatRupiah(r.pricePerNominal)
          : "-",
        category: r.category,
        family: r.family,
        reason: r.reason,
      }))
  );

  console.log("\n========================================");
  console.log("FINAL RESULT");
  console.log("========================================");
  console.log(
    "READ ONLY: tidak ada perubahan database dilakukan."
  );
}

main()
  .catch((err: any) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
