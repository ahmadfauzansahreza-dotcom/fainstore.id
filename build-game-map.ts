import { db } from "./src/lib/db";

function normalize(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name: string) {
  return new Set(normalize(name).split(" "));
}

async function main() {
  const games = await db.game.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });

  const skipWords = new Set([
    "unipin",
    "gamepoint",
    "weekly",
    "monthly",
    "pass",
    "premium",
    "promotion",
    "daily",
    "special",
    "upgrade",
    "growth",
    "feedback",
    "selection",
    "gift",
    "supplies",
    "inquiry",
    "dgr",
    "dgh",
    "dghm",
    "dghl",
    "global",
    "gp",
    "br",
    "my",
    "ph",
    "id",
    "kcid",
    "rzid",
    "up",
    "dg",
    "new",
    "x"
  ]);

  const candidates = games.filter(g => {
    const ts = tokens(g.name);
    const useful = [...ts].filter(t => !skipWords.has(t));
    return useful.length > 0;
  });

  const map = candidates.map(mainGame => {
    const mainTokens = tokens(mainGame.name);

    const related = games.filter(g => {
      if (g.id === mainGame.id) return false;

      const otherTokens = tokens(g.name);

      const usefulMain = [...mainTokens].filter(
        t => !skipWords.has(t)
      );

      if (usefulMain.length === 0) return false;

      const matched = usefulMain.filter(
        t => otherTokens.has(t)
      );

      return matched.length >= Math.max(
        1,
        Math.ceil(usefulMain.length * 0.6)
      );
    });

    return {
      mainGame: mainGame.name,
      slug: mainGame.slug,
      products: mainGame._count.products,
      relatedGames: related.map(g => ({
        name: g.name,
        slug: g.slug,
        products: g._count.products
      }))
    };
  });

  console.log("\n===== GAME MAPPING REPORT =====\n");
  console.log(`TOTAL DATABASE : ${games.length}`);
  console.log(`TOTAL CANDIDATE: ${candidates.length}\n`);

  for (const item of map) {
    console.log(`\n### ${item.mainGame}`);
    console.log(`slug     : ${item.slug}`);
    console.log(`products : ${item.products}`);

    if (item.relatedGames.length) {
      console.log("related :");

      for (const g of item.relatedGames) {
        console.log(
          `  - ${g.name} | ${g.slug} | products=${g.products}`
        );
      }
    }
  }

  console.log("\n================================");
  console.log("GAME MAPPING BERHASIL.");
  console.log("Database TIDAK diubah.");
  console.log("================================\n");

  await db.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
