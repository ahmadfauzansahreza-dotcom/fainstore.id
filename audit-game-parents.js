require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

function normalize(name = "") {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(unipin|gamepoint|gamepoint id|dgr|dghost|rzid|kcid)\b/g, " ")
    .replace(/\b(global|sea|my|ph|br|id|asia|europe|us)\b/g, " ")
    .replace(/\b(gp|voucher|gamepoint)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectFamily(game) {
  const s = `${game.name} ${game.slug}`.toLowerCase();

  if (/free.?fire/.test(s)) return "free-fire";
  if (/mobile.?legend|mlbb/.test(s)) return "mobile-legend";
  if (/call.?of.?duty|codm/.test(s)) return "call-of-duty-mobile";
  if (/lords.?mobile/.test(s)) return "lords-mobile";
  if (/dragon.?raja/.test(s)) return "dragon-raja";
  if (/genshin/.test(s)) return "genshin-impact";
  if (/honkai.*star.*rail|star.?rail/.test(s)) return "honkai-star-rail";
  if (/ragnarok/.test(s)) return "ragnarok";
  if (/tom.*jerry/.test(s)) return "tom-and-jerry";
  if (/ace.?racer/.test(s)) return "ace-racer";
  if (/naruto/.test(s)) return "naruto";
  if (/one.?punch/.test(s)) return "one-punch-man";
  if (/omega.*legends/.test(s)) return "omega-legends";
  if (/laplace/.test(s)) return "laplace-m";
  if (/football.*master/.test(s)) return "football-master";
  if (/saint.*seiya/.test(s)) return "saint-seiya";
  if (/mango.*live/.test(s)) return "mango-live";
  if (/bigo/.test(s)) return "bigo-live";
  if (/project.*entropy/.test(s)) return "project-entropy";
  if (/valorant/.test(s)) return "valorant";
  if (/harry.*potter/.test(s)) return "harry-potter";
  if (/metal.*slug/.test(s)) return "metal-slug";
  if (/google.*play/.test(s)) return "google-play";
  if (/garena/.test(s)) return "garena";
  if (/aov|arena.*valor/.test(s)) return "aov";

  return null;
}

async function main() {
  const games = await db.game.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });

  const report = games.map(g => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    products: g._count.products,
    detectedParent: detectFamily(g),
    normalized: normalize(g.name)
  }));

  const groups = {};

  for (const g of report) {
    const key = g.detectedParent || "UNMAPPED";

    if (!groups[key]) {
      groups[key] = {
        parent: key,
        games: 0,
        products: 0,
        entries: []
      };
    }

    groups[key].games++;
    groups[key].products += g.products;

    groups[key].entries.push({
      id: g.id,
      name: g.name,
      slug: g.slug,
      products: g.products
    });
  }

  const output = {
    totalGames: games.length,
    totalProducts: games.reduce((n, g) => n + g._count.products, 0),
    groups
  };

  fs.writeFileSync(
    "game-parent-audit.json",
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log("========================================");
  console.log("       FAIN STORE GAME PARENT AUDIT");
  console.log("========================================");
  console.log("TOTAL GAMES    :", games.length);
  console.log(
    "TOTAL PRODUCTS :",
    games.reduce((n, g) => n + g._count.products, 0)
  );
  console.log("----------------------------------------");

  for (const [key, value] of Object.entries(groups).sort()) {
    console.log(
      `${key.padEnd(30)} | games=${String(value.games).padStart(3)} | products=${value.products}`
    );
  }

  console.log("----------------------------------------");

  const unmapped = report.filter(x => !x.detectedParent);

  console.log("UNMAPPED GAMES :", unmapped.length);

  if (unmapped.length) {
    console.log("\n===== UNMAPPED =====");

    for (const g of unmapped) {
      console.log(
        `${g.name} | ${g.slug} | products=${g.products}`
      );
    }
  }

  console.log("\nFILE BERHASIL : game-parent-audit.json");
  console.log("========================================");
}

main()
  .catch(err => {
    console.error("ERROR:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
