const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const GAME_RULES = [
  ["free-fire", ["free fire", "freefire", "ff diamond"]],
  ["mobile-legend", ["mobile legend", "mobile legends", "mlbb", "ml diamond"]],
  ["call-of-duty-mobile", ["call of duty mobile", "codm", "cp call"]],
  ["dragon-raja", ["dragon raja"]],
  ["genshin-impact", ["genshin impact", "genesis crystal", "welkin moon"]],
  ["lords-mobile", ["lords mobile", "lord mobile"]],
  ["omega-legends", ["omega legends"]],
  ["sausage-man", ["sausage man"]],
  ["super-sus", ["super sus", "goldstar", "gold star"]],
  ["tom-and-jerry", ["tom and jerry"]],
  ["tower-of-fantasy", ["tower of fantasy", "tanium"]],
  ["hago", ["hago"]],
  ["ragnarok", ["ragnarok"]],
  ["ace-racer", ["ace racer"]],
  ["mu-origin", ["mu origin", "divine diamond", "divine diamonds"]],
  ["never-after", ["never after", "lifeafter"]],
  ["eudemons-online", ["eudemons online"]],
  ["laplace-m", ["laplace m"]],
  ["lita", ["lita"]],
  ["ludo-club", ["ludo club"]],
  ["mangatoon", ["mangatoon"]],
  ["bigo-live", ["bigo live", "mango live"]],
  ["metal-slug", ["metal slug", "slugfest"]],
  ["one-punch-man", ["one punch man"]],
  ["point-blank", ["point blank", "pb cash"]],
  ["honkai-star-rail", ["honkai star rail", "oneiric shard", "star rail"]],
  ["saint-seiya", ["saint seiya"]],
  ["mirage-perfect-skyline", ["mirage perfect skyline"]],
  ["football-master", ["football master", "fmp"]],
  ["be-the-king", ["be the king"]],
  ["revelation", ["revelation"]],
  ["harry-potter", ["harry potter", "jewels harry potter"]],
  ["google-play", ["google play"]],
];

function detectGame(name) {
  const text = normalize(name);

  const matches = [];

  for (const [slug, keywords] of GAME_RULES) {
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += keyword.length;
      }
    }

    if (score > 0) {
      matches.push({ slug, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return matches;
}

async function main() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      game: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      specifications: true,
    },
  });

  console.log("========================================");
  console.log("FAIN STORE — CLASSIFIER V3 AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");
  console.log(`TOTAL PRODUCTS: ${products.length}`);
  console.log("");

  const operators = new Map();

  for (const p of products) {
    const spec =
      p.specifications &&
      typeof p.specifications === "object"
        ? p.specifications
        : {};

    const operatorId =
      spec.operatorId ??
      spec.operator_id ??
      spec.operator ??
      null;

    const key = String(operatorId ?? "NONE");

    if (!operators.has(key)) {
      operators.set(key, []);
    }

    operators.get(key).push(p);
  }

  console.log(`TOTAL OPERATORS: ${operators.size}`);
  console.log("");

  let resolved = 0;
  let unresolved = 0;
  let conflicts = 0;

  for (const [operatorId, items] of operators) {
    const detected = new Map();

    for (const p of items) {
      const matches = detectGame(p.name);

      if (matches.length > 0) {
        const best = matches[0];

        detected.set(
          best.slug,
          (detected.get(best.slug) || 0) + 1
        );
      }
    }

    const ranking = [...detected.entries()]
      .sort((a, b) => b[1] - a[1]);

    const currentGames = new Map();

    for (const p of items) {
      if (p.game) {
        const key =
          `${p.game.id}|${p.game.slug}|${p.game.name}`;

        currentGames.set(
          key,
          (currentGames.get(key) || 0) + 1
        );
      }
    }

    const currentRanking = [...currentGames.entries()]
      .sort((a, b) => b[1] - a[1]);

    const best = ranking[0];

    if (!best) {
      unresolved++;
      continue;
    }

    resolved++;

    const candidate = best[0];
    const candidateCount = best[1];

    const current =
      currentRanking.length > 0
        ? currentRanking[0][0]
        : "NONE";

    const currentCount =
      currentRanking.length > 0
        ? currentRanking[0][1]
        : 0;

    const currentSlug =
      current === "NONE"
        ? "NONE"
        : current.split("|")[1];

    const isConflict =
      currentSlug !== "NONE" &&
      currentSlug !== candidate;

    if (isConflict) {
      conflicts++;
    }

    console.log(
      [
        `operator=${operatorId}`,
        `products=${items.length}`,
        `candidate=${candidate}`,
        `candidateCount=${candidateCount}`,
        `current=${currentSlug}`,
        `currentCount=${currentCount}`,
        `conflict=${isConflict ? "YES" : "NO"}`,
        `sample=${items
          .slice(0, 3)
          .map(p => p.name)
          .join(" || ")}`
      ].join(" | ")
    );
  }

  console.log("");
  console.log("========================================");
  console.log("CLASSIFIER V3 SUMMARY");
  console.log("========================================");
  console.log(`OPERATORS: ${operators.size}`);
  console.log(`RESOLVED: ${resolved}`);
  console.log(`UNRESOLVED: ${unresolved}`);
  console.log(`CONFLICTS: ${conflicts}`);
  console.log("========================================");
  console.log("AUDIT SELESAI — READ ONLY");

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await db.$disconnect();
  } catch {}

  process.exit(1);
});
