import { db } from "./src/lib/db";

function normalize(value: string = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string = "") {
  return normalize(value).replace(/\s/g, "");
}

function tokens(value: string = "") {
  return new Set(normalize(value).split(" ").filter(Boolean));
}

async function main() {
  const [games, products] = await Promise.all([
    db.game.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      include: {
        game: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  console.log("\n===== FULL PRODUCT GAME AUDIT =====\n");
  console.log(`GAMES    : ${games.length}`);
  console.log(`PRODUCTS : ${products.length}\n`);

  const gameTokens = games.map((g) => ({
    game: g,
    tokens: tokens(g.name),
    compact: compact(g.name),
  }));

  let matched = 0;
  let unmatched = 0;
  let existing = 0;

  const reports: any[] = [];

  for (const p of products) {
    const source = `${p.name} ${p.slug}`;

    if (p.game) {
      existing++;
      continue;
    }

    const pt = tokens(source);
    const pc = compact(source);

    const candidates = gameTokens
      .map((g) => {
        let score = 0;

        for (const token of g.tokens) {
          if (token.length >= 3 && pt.has(token)) {
            score += token.length;
          }
        }

        if (g.compact && pc.includes(g.compact)) {
          score += g.compact.length * 2;
        }

        return {
          game: g.game,
          score,
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      matched++;

      reports.push({
        productId: p.id,
        product: p.name,
        slug: p.slug,
        candidates: candidates.slice(0, 5).map((x) => ({
          game: x.game.name,
          slug: x.game.slug,
          score: x.score,
        })),
      });
    } else {
      unmatched++;

      reports.push({
        productId: p.id,
        product: p.name,
        slug: p.slug,
        candidates: [],
      });
    }
  }

  const unmatchedRows = reports.filter(
    (x) => x.candidates.length === 0
  );

  console.log("===== RESULT =====");
  console.log(`ALREADY CONNECTED : ${existing}`);
  console.log(`CAN MATCH         : ${matched}`);
  console.log(`UNMATCHED         : ${unmatched}`);
  console.log(`TOTAL             : ${products.length}`);

  console.log("\n===== UNMATCHED =====\n");

  for (const x of unmatchedRows) {
    console.log(`${x.productId} | ${x.product} | ${x.slug}`);
  }

  console.log("\n====================");
  console.log("DATABASE TIDAK DIUBAH.");
  console.log("====================\n");

  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
