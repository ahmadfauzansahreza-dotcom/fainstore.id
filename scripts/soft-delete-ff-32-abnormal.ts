require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// 32 produk Free Fire yang telah diverifikasi sebagai abnormal.
// 512+3 dan 925+5 TIDAK termasuk di sini.
const TARGET_IDS = [
  "cmszxr7f200un2js6kxu5yp45",
  "cmszxr7dz00412js66jb68tmm",
  "cmszxr7ea00be2js6zi6w71c1",
  "cmszxr7f200uu2js6lxlcymq0",
  "cmszxr7f200uo2js6ymzzt9dq",
  "cmszxr7dz00422js6cgj9crjr",
  "cmszxr7f100tj2js6dy2kg8tn",
  "cmszxr7f300uw2js665tlt8hl",
  "cmszxr7dz00432js65jqer8xz",
  "cmszxr7f200up2js6r3vj7ldi",
  "cmszxr7dz00442js65klgmwy1",
  "cmszxr7eb00bf2js6sstlzo6b",
  "cmszxr7eb00bg2js6ygmtv5va",
  "cmszxr7f200uq2js6m5sxr0pi",
  "cmszxr7dz00452js6u3d4nq9b",
  "cmszxr7eb00bh2js6eqpwhmul",
  "cmszxr7f300uv2js6ygu4apew",
  "cmszxr7f300ux2js6nav9ziyq",
  "cmszxr7f200us2js6kwhg8b2k",
  "cmszxr7dz00472js67zedljr6",
  "cmszxr7eb00bj2js6rkoe6rt2",
  "cmszxr7f200ut2js68fa2dh5l",
  "cmszxr7dz00482js6k6xxrqb0",
  "cmszxr7eb00bk2js6merksrbm",
  "cmszxr7f500wg2js63nanysh8",
  "cmszxr7e000492js65icbi3v1",
  "cmszxr7f500wh2js6vrd583ei",
  "cmszxr7e0004a2js6xqvukwem",
  "cmszxr7e0004b2js64wo8hfpo",
  // 3 produk extreme-price lainnya yang masuk batch abnormal
  "cmszxr7f200ur2js63o4g6mf6",
  "cmszxr7f300uw2js665tlt8hl",
  "cmszxr7f200uu2js6lxlcymq0",
];

async function main() {
  console.log("========================================");
  console.log("SOFT DELETE 32 ABNORMAL FREE FIRE");
  console.log("========================================");

  const uniqueIds = [...new Set(TARGET_IDS)];

  if (uniqueIds.length !== 32) {
    throw new Error(
      `TARGET COUNT INVALID: expected 32, got ${uniqueIds.length}`
    );
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: uniqueIds },
      game: {
        name: {
          contains: "Free Fire",
          mode: "insensitive",
        },
      },
      status: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      priceIdr: true,
      status: true,
    },
  });

  console.table(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.priceIdr,
      action: "SOFT_DELETE",
    }))
  );

  if (products.length !== 32) {
    throw new Error(
      `TARGET VERIFICATION FAILED: expected 32 active FF products, found ${products.length}`
    );
  }

  const result = await prisma.product.updateMany({
    where: {
      id: { in: uniqueIds },
      status: true,
      deletedAt: null,
    },
    data: {
      status: false,
      deletedAt: new Date(),
    },
  });

  console.log(`SOFT_DELETED: ${result.count}`);

  console.log("\n========================================");
  console.log("VERIFICATION");
  console.log("========================================");

  const remaining = await prisma.product.count({
    where: {
      id: { in: uniqueIds },
      status: true,
      deletedAt: null,
    },
  });

  console.log(`REMAINING ACTIVE TARGETS: ${remaining}`);

  if (remaining !== 0 || result.count !== 32) {
    throw new Error("VERIFICATION FAILED");
  }

  console.log("OK: 32 produk abnormal sudah tidak aktif.");
  console.log("512+3 dan 925+5 tidak disentuh.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
