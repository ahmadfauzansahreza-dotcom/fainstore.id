require("dotenv/config");

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const targets = await prisma.product.findMany({
    where: {
      status: false,
      deletedAt: null,
    },
  });

  console.log("\n========================================");
  console.log("INACTIVE PRODUCT CLEANUP");
  console.log("========================================");
  console.log(`TARGETS: ${targets.length}`);

  if (targets.length === 0) {
    console.log("Tidak ada inactive product yang perlu dibersihkan.");
    return;
  }

  // Backup scalar fields sebelum perubahan
  const backupDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupFile = path.join(
    backupDir,
    `inactive-products-backup-${timestamp}.json`
  );

  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      targets,
      (_, value) => {
        if (value instanceof Date) return value.toISOString();
        return value;
      },
      2
    )
  );

  console.log(`BACKUP: ${backupFile}`);

  // Soft-delete seluruh inactive product
  const result = await prisma.product.updateMany({
    where: {
      status: false,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  console.log(`SOFT-DELETED: ${result.count}`);

  // Verifikasi
  const remaining = await prisma.product.count({
    where: {
      status: false,
      deletedAt: null,
    },
  });

  console.log("\n========================================");
  console.log("VERIFICATION");
  console.log("========================================");
  console.log(`REMAINING INACTIVE: ${remaining}`);

  if (remaining === 0) {
    console.log("OK: seluruh inactive product sudah dibersihkan dari katalog aktif.");
  } else {
    console.log("WARNING: masih ada inactive product yang belum dibersihkan.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\nCLEANUP FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
