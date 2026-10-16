const fs = require("fs");

const audit = JSON.parse(
  fs.readFileSync("game-parent-audit.json", "utf8")
);

function detect(slug = "", name = "") {
  const s = `${slug} ${name}`.toLowerCase();

  const rules = [
    [/free.?fire/, "free-fire"],
    [/mobile.?legend|mlbb|twilight.*ml|starlight.*mobile.*legend/, "mobile-legend"],
    [/call.?of.?duty|codm/, "call-of-duty-mobile"],
    [/lords.?mobile|lord.?mobile/, "lords-mobile"],
    [/dragon.?raja/, "dragon-raja"],
    [/genshin|genesis.?crystal|welkin.?moon/, "genshin-impact"],
    [/honkai.*star.*rail|star.?rail/, "honkai-star-rail"],
    [/ragnarok/, "ragnarok"],
    [/tom.*jerry/, "tom-and-jerry"],
    [/ace.?racer/, "ace-racer"],
    [/naruto/, "naruto"],
    [/one.?punch/, "one-punch-man"],
    [/omega.*legends/, "omega-legends"],
    [/laplace/, "laplace-m"],
    [/football.*master/, "football-master"],
    [/saint.*seiya/, "saint-seiya"],
    [/mango.*live/, "mango-live"],
    [/bigo/, "bigo-live"],
    [/project.*entropy/, "project-entropy"],
    [/valorant/, "valorant"],
    [/harry.*potter/, "harry-potter"],
    [/metal.*slug/, "metal-slug"],
    [/google.*play/, "google-play"],
    [/garena/, "garena"],
    [/aov|arena.*valor/, "aov"],

    [/hago/, "hago"],
    [/never.*after/, "never-after"],
    [/mu.?origin/, "mu-origin"],
    [/life.?after/, "lifeafter"],
    [/lita/, "lita"],
    [/ludo.*club/, "ludo-club"],
    [/mangatoon/, "mangatoon"],
    [/mirage.*perfect.*skyline/, "mirage-perfect-skyline"],
    [/tower.*fantasy|tanium.*tower/, "tower-of-fantasy"],
    [/revelation/, "revelation"],
    [/be.*the.*king/, "be-the-king"],
    [/super.*sus|golden.*star.*super/, "super-sus"],
    [/sausage.*man/, "sausage-man"],
    [/marvel.*super.*war|star.*marvel/, "marvel-super-war"],
    [/hyper.*front|star.*quartz/, "hyper-front"],
    [/starfall.*fantasy/, "starfall-fantasy"],
    [/point.*blank/, "point-blank"],
    [/idle.*legend/, "idle-legend"],
    [/eudemons/, "eudemons-online"],
    [/crystals.*light.*thei/, "crystals-light-of-thei"],
    [/bp.*card/, "bp-card"],
    [/kartu.*bulanan/, "weekly-monthly-card"],
    [/kartu.*mingguan|weekly.*pass/, "weekly-pass"],
    [/starlight.*member/, "starlight-member"],
    [/twilight.*pass/, "twilight-pass"],
    [/smile.*non.*indo/, "mobile-legend"],
    [/x.*weekly.*pass.*ml/, "mobile-legend"],
  ];

  for (const [regex, parent] of rules) {
    if (regex.test(s)) return parent;
  }

  return null;
}

const games = [];

for (const group of Object.values(audit.groups)) {
  for (const game of group.entries) {
    games.push(game);
  }
}

const result = games.map(game => ({
  id: game.id,
  name: game.name,
  slug: game.slug,
  products: game.products,
  parentSlug: detect(game.slug, game.name),
  status: detect(game.slug, game.name)
    ? "AUTO_CANDIDATE"
    : "NEEDS_REVIEW"
}));

const summary = {};

for (const g of result) {
  const p = g.parentSlug || "NEEDS_REVIEW";

  if (!summary[p]) {
    summary[p] = {
      games: 0,
      products: 0
    };
  }

  summary[p].games++;
  summary[p].products += g.products;
}

fs.writeFileSync(
  "game-parent-candidates.json",
  JSON.stringify({
    totalGames: result.length,
    totalProducts: result.reduce((a, b) => a + b.products, 0),
    summary,
    games: result
  }, null, 2)
);

console.log("===== GAME PARENT CANDIDATES =====");
console.log("TOTAL GAMES    :", result.length);
console.log(
  "AUTO CANDIDATE :",
  result.filter(x => x.parentSlug).length
);
console.log(
  "NEEDS REVIEW   :",
  result.filter(x => !x.parentSlug).length
);
console.log("----------------------------------------");

for (const [parent, data] of Object.entries(summary)
  .sort((a, b) => b[1].games - a[1].games)) {
  console.log(
    `${parent.padEnd(32)} | games=${String(data.games).padStart(3)} | products=${data.products}`
  );
}

console.log("----------------------------------------");
console.log("FILE : game-parent-candidates.json");
console.log("DATABASE TIDAK DIUBAH");
