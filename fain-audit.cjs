
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

async function main() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      gameId: true,
      game: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      specifications: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log("===== PRODUCT → GAME → OPERATOR AUDIT =====");
  console.log("TOTAL PRODUCTS:", products.length);
  console.log("----------------------------------------");

  const groups = new Map();

  for (const p of products) {
    const spec =
      p.specifications &&
      typeof p.specifications === "object"
        ? p.specifications
        : {};

    const operatorId =
      spec.operator_id ??
      spec.operatorId ??
      spec.operator ??
      null;

    const key = String(operatorId ?? "NONE");

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(p);
  }

  for (const [operatorId, items] of groups) {
    const games = new Map();

    for (const p of items) {
      const g = p.game;

      const key = g
        ? `${g.id}|${g.slug}|${g.name}`
        : "NO_GAME";

      games.set(key, (games.get(key) || 0) + 1);
    }

    console.log(
      `operator=${operatorId} | products=${items.length}`
    );

    for (const [game, count] of games) {
      console.log(`  GAME ${count}x | ${game}`);
    }

    console.log(
      `  SAMPLE: ${items
        .slice(0, 3)
        .map((p) => p.name)
        .join(" || ")}`
    );

    console.log("");
  }

  console.log("========================================");
  console.log("AUDIT SELESAI - READ ONLY");

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await db.$disconnect();
  } catch {}

  process.exit(1);
});
