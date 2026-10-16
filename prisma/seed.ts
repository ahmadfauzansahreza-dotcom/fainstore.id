import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { encryptCredential } from "../src/lib/crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const db = new PrismaClient({ adapter });

async function main() {
  const freeFire = await db.game.upsert({
    where: { slug: "free-fire" },
    update: {},
    create: {
      name: "Free Fire",
      slug: "free-fire",
    },
  });

  const ffAccountCategory = await db.category.upsert({
    where: { slug: "ff-akun" },
    update: {},
    create: {
      name: "Akun Free Fire",
      slug: "ff-akun",
      gameId: freeFire.id,
    },
  });

  await db.category.upsert({
    where: { slug: "ff-topup" },
    update: {},
    create: {
      name: "Top Up Free Fire",
      slug: "ff-topup",
      gameId: freeFire.id,
    },
  });

  const demoProduct = await db.product.upsert({
    where: {
      slug: "demo-akun-ff-level-65",
    },
    update: {},
    create: {
      name: "[DEMO] Akun FF Level 65",
      slug: "demo-akun-ff-level-65",
      type: "GAME_ACCOUNT",
      gameId: freeFire.id,
      categoryId: ffAccountCategory.id,
      description:
        "Contoh data demo untuk pengembangan. Bukan produk yang benar-benar dijual.",
      specifications: {
        Level: "65",
        Rank: "Heroic",
        EvoGun: "AN94",
      },
      priceIdr: 500000,
      originalPriceIdr: 800000,
      discountPct: 37,
      isDemo: true,
      status: true,
      images: {
        create: [
          {
            url: "/products/ff-level-65.jpg",
          },
        ],
      },
    },
  });

  const existingAccount = await db.gameAccount.findFirst({
    where: {
      productId: demoProduct.id,
    },
  });

  if (!existingAccount) {
    await db.gameAccount.create({
      data: {
        productId: demoProduct.id,
        loginMethod: "Email",
        usernameEmailEnc: encryptCredential(
          "demo.akun.ff@example.com"
        ),
        passwordEnc: encryptCredential(
          "DemoPassword123!"
        ),
        status: "AVAILABLE",
      },
    });
  }

  await db.product.upsert({
    where: {
      slug: "demo-topup-diamond-ff-100",
    },
    update: {},
    create: {
      name: "[DEMO] Top Up 100 Diamond",
      slug: "demo-topup-diamond-ff-100",
      type: "TOPUP",
      gameId: freeFire.id,
      priceIdr: 100000,
      stockQty: 9999,
      isDemo: true,
      status: true,
      images: {
        create: [
          {
            url: "/products/ff-diamond.jpg",
          },
        ],
      },
    },
  });

  const existingSettings = await db.settings.findFirst();

  if (!existingSettings) {
    await db.settings.create({
      data: {
        storeName: "FAIN STORE",
        storeDescription: "Marketplace Akun Game & Top Up",
      },
    });
  }

  console.log("Seed data demo berhasil dibuat.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

