require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function getDiamondNominal(name) {
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
    },
  });

  const exclude = new Set([
    "512+3 Diamond Free Fire",
    "925 + 5 Diamond Free Fire",
  ]);

  const candidates = products
    .map((p) => {
      const nominal = getDiamondNominal(p.name);
      if (!nominal || nominal <= 0) return null;

      const expected = nominal * 140;
      const ratio = p.priceIdr / expected;

      return {
        ...p,
        nominal,
        ratio,
      };
    })
    .filter(Boolean)
    .filter((p) => p.ratio >= 10)
    .filter((p) => !exclude.has(p.name));

  console.log("\n========================================");
  console.log("SOFT DELETE 32 FREE FIRE ANOMALIES");
  console.log("========================================");
  console.table(
    candidates.map((p) => ({
      id: p.id,
      name: p.name,
      nominal: p.nominal,
      priceIdr: p.priceIdr,
      ratio: p.ratio.toFixed(1),
    }))
  );

  if (candidates.length !== 32) {
    throw new Error(
      `ABORT: expected 32 candidates, found ${candidates.length}. DB TIDAK DIUBAH.`
    );
  }

  const backup = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    priceIdr: p.priceIdr,
    nominal: p.nominal,
    ratio: p.ratio,
  }));

  const fs = require("fs");
  const path = require("path");

  const backupDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const backupPath = path.join(
    backupDir,
    `ff-32-anomalies-before-delete-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`
  );

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`BACKUP: ${backupPath}`);

  for (const p of candidates) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        status: false,
        deletedAt: new Date(),
      },
    });

    console.log(`SOFT_DELETED: ${p.name}`);
  }

  const remaining = await prisma.product.count({
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
  });

  console.log("\n========================================");
  console.log("VERIFICATION");
  console.log("========================================");
  console.log(`ACTIVE FREE FIRE REMAINING: ${remaining}`);
  console.log("OK: 32 anomaly Free Fire berhasil di-soft-delete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
