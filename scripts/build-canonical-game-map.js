const fs = require("fs");

const master = JSON.parse(
  fs.readFileSync("master-product-map.json", "utf8")
);

const aliases = {
  "free-fire": "free-fire",
  "free-fire-dgh": "free-fire",
  "free-fire-dgr": "free-fire",
  "free-fire-dg": "free-fire",
  "free-fire-dghf": "free-fire",
  "free-fire-unipin": "free-fire",
  "free-fire-bulanan": "free-fire",
  "free-fire-member-bulanan-new": "free-fire",
  "free-fire-member-bulanan-new-x": "free-fire",
  "free-fire-mingguan": "free-fire",
  "member-bulanan-free-fire": "free-fire",
  "member-mingguan-free-fire": "free-fire",
  "member-mingguan-free-fire-x": "free-fire",

  "mobile-legends": "mobile-legends",
  "mobile-legend": "mobile-legends",
  "mobile-legend-kcid": "mobile-legends",
  "mobile-legend-unipin": "mobile-legends",
  "mobile-legend-unipin-my": "mobile-legends",
  "mobile-legend-unipin-ph": "mobile-legends",
  "mobile-legend-unipin-br": "mobile-legends",
  "mobile-legend-dgr": "mobile-legends",
  "mobile-legend-dghost": "mobile-legends",
  "mobile-legend-gp": "mobile-legends",
  "mobile-legend-gp-id": "mobile-legends",
  "mobile-legend-global": "mobile-legends",
  "mobile-legend-global-gp": "mobile-legends",
  "mobile-legend-rzid": "mobile-legends",
  "x-weekly-pass-ml-gp": "mobile-legends",
  "x-weekly-pass-mobile-legend": "mobile-legends",
  "x-weekly-pass-mobile-legend-unipin-my": "mobile-legends",
  "x-weekly-pass-mobile-legend-unipin-ph": "mobile-legends",
  "starlight-member-mobile-legend-br": "mobile-legends",
  "starlight-member-mobile-legend-global": "mobile-legends",
  "starlight-member-mobile-legend-unipin-my": "mobile-legends",
  "starlight-member-plus-br": "mobile-legends",
  "starlight-member-plus-mobile-legend-global": "mobile-legends",
  "starlight-member-plus-mobile-legend-unipin-my": "mobile-legends",
  "twilight-ml-smile": "mobile-legends",
  "twilight-pass-br": "mobile-legends",
  "twilight-pass-kcid": "mobile-legends",
  "twilight-pass-mobile-legend-global": "mobile-legends",
  "twilight-pass-mobile-legend-gp-id": "mobile-legends",
  "twilight-pass-mobile-legend-unipin-my": "mobile-legends",
  "twilight-pass-mobile-legend-unipin-ph": "mobile-legends",
  "weekly-pass-kcid": "mobile-legends",
  "weekly-pass-mobile-legend-gp-id": "mobile-legends",
  "weekly-pass-unipin-br": "mobile-legends",

  "pubg-mobile": "pubg-mobile",

  "call-of-duty-mobile": "call-of-duty-mobile",
  "call-of-duty-mobile-up": "call-of-duty-mobile",
  "call-of-duty-dgr": "call-of-duty-mobile",
  "codm-kiosgamer": "call-of-duty-mobile",

  "valorant": "valorant",
  "points-valorant-gamepoint": "valorant",

  "genshin-impact": "genshin-impact",
  "genesis-crystals-unipin-ph": "genshin-impact",
  "genesis-crystals-unipin-my": "genshin-impact",
  "genesis-crystals-genshin-impact-gp": "genshin-impact",
  "blessing-of-the-welkin-moon-genshin-impact-gp": "genshin-impact",
  "blessing-of-the-welkin-moon-unipin-my": "genshin-impact",
  "blessing-of-the-welkin-moon-unipin-ph": "genshin-impact",

  "arena-of-valor": "arena-of-valor",
  "aov-dgh": "arena-of-valor",
  "aov-dgr": "arena-of-valor",
  "aov-vouchers": "arena-of-valor",
  "aov-kiosgamer": "arena-of-valor",

  "ragnarok-origin": "ragnarok-origin",
  "nyan-berry-ragnarok-origin-global": "ragnarok-origin",
  "ragnarok-origin-unipin-my-nyan-berry": "ragnarok-origin",
  "ragnarok-nyan-berry-unipin-ph": "ragnarok-origin",

  "ragnarok-m-eternal-love": "ragnarok-m-eternal-love",
  "big-cat-ragnarok-m-unipin-ph": "ragnarok-m-eternal-love",
  "big-cat-ragnarok-m-eternal-love-gamepoint": "ragnarok-m-eternal-love",
  "big-cat-coinsragnarok-m-eternal-love-gamepoint": "ragnarok-m-eternal-love",

  "dragon-raja": "dragon-raja",
  "dragon-raja-gp": "dragon-raja",
  "dragon-raja-unipin-ph": "dragon-raja",
  "investment-fund-dragon-raja-gp": "dragon-raja",
  "investment-fund-ii-dragon-raja-gp": "dragon-raja",

  "lifeafter": "lifeafter",
  "lifeafter-gamepoint": "lifeafter",
  "lifeafter-unipin-ph": "lifeafter",
  "lifeafter-unipin-my": "lifeafter",

  "one-punch-man": "one-punch-man",
  "one-punch-man-the-strongest-unipin-my": "one-punch-man",
  "one-punch-man-the-strongest-gamepoint": "one-punch-man",
  "one-punch-man-the-strongest-unipin-ph": "one-punch-man",

  "revelation": "revelation",
  "revelation-gamepoint": "revelation",

  "omega-legends": "omega-legends",
  "omega-legends-gp": "omega-legends",
  "omega-legends-unipin-ph": "omega-legends",

  "never-after": "never-after",
  "never-after-gamepoint": "never-after",
  "never-after-unipin-my": "never-after",
  "never-after-unipin-ph": "never-after",

  "marvel-super-war": "marvel-super-war",
  "star-marvel-super-war-gamepoint": "marvel-super-war",
  "star-marvel-super-war-unipin-my": "marvel-super-war",
  "star-marvel-super-war-unipin-ph": "marvel-super-war",

  "ace-racer": "ace-racer",
  "ace-racer-gamepoint": "ace-racer",
  "ace-racer-unipin-my": "ace-racer",
  "ace-racer-unipin-ph": "ace-racer",

  "sausage-man": "sausage-man",
  "sausage-man-gp": "sausage-man",
  "sausage-man-unipin-my": "sausage-man",
  "sausage-man-unipin-ph": "sausage-man",

  "tom-and-jerry": "tom-and-jerry",
  "tom-and-jerry-gp": "tom-and-jerry",
  "tom-and-jerry-unipin-my": "tom-and-jerry",
  "tom-and-jerry-unipin-ph": "tom-and-jerry",

  "tower-of-fantasy": "tower-of-fantasy",
  "tanium-tower-of-fantasy-gp-global": "tower-of-fantasy",
  "tanium-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",
  "tanium-tower-of-fantasy-gp-sea": "tower-of-fantasy",
  "basic-pass-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",
  "collector-edition-pass-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",
  "monthly-pass-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",
  "rookie-supplies-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",
  "upgrade-pass-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",
  "adventure-pack-tower-of-fantasy-global-gamepoint": "tower-of-fantasy",

  "mangatoon": "mangatoon",
  "mangatoon-unipin-my": "mangatoon",
  "mangatoon-unipin-ph": "mangatoon",

  "lords-mobile": "lords-mobile",
  "lords-mobile-gp": "lords-mobile",
  "lords-mobile-unipin": "lords-mobile",
  "lord-mobile-unipin-ph": "lords-mobile",
  "lord-mobile-unipin-my": "lords-mobile",

  "honkai-star-rail": "honkai-star-rail",
  "honkai-star-rail-gamepoint-oneiric-shard": "honkai-star-rail",
  "honkai-star-rail-gamepoint-express-supply-pass": "honkai-star-rail",

  "harry-potter": "harry-potter",
  "jewels-harry-potter-gp": "harry-potter",

  "starfall-fantasy": "starfall-fantasy",
  "starfall-fantasy-unipin-ph": "starfall-fantasy",

  "mirage-perfect-skyline": "mirage-perfect-skyline",
  "mirage-perfect-skyline-gamepoint": "mirage-perfect-skyline",
  "mirage-perfect-skyline-unipin-ph": "mirage-perfect-skyline",

  "hyper-front": "hyper-front",
  "star-quartz-hyper-front-sea-gamepoint": "hyper-front",

  "goddess-of-victory-nikke": "goddess-of-victory-nikke",
  "gem-goddess-of-victory-nikke-gamepoint": "goddess-of-victory-nikke",
  "gem-of-victory-nikke-gamepoint": "goddess-of-victory-nikke",

  "project-entropy": "project-entropy",
  "star-chips-project-entropy-unipin-ph": "project-entropy",

  "idle-legends": "idle-legends",
  "idle-legend-unipin-ph": "idle-legends",

  "mu-origin-2": "mu-origin-2",
  "mu-origin-3": "mu-origin-3",
  "mu-origin-gamepoint": "mu-origin-2",
  "devine-mu-origin-unipin-ph": "mu-origin-2",
  "divine-mu-origin-gamepoint": "mu-origin-2",
  "divine-mu-origin-unipin-my": "mu-origin-2",
  "mu-origin-unipin-my": "mu-origin-2",
  "mu-origin-unipin-ph": "mu-origin-2",

  "mango-live": "mango-live",
  "mango-live-unipin-my": "mango-live",

  "bigo-live": "bigo-live",
  "bigo-live-unipin-ph": "bigo-live",

  "lita": "lita",
  "lita-unipin-my": "lita",

  "ludo-club": "ludo-club",
  "ludo-club-unipin-my": "ludo-club",
  "ludo-club-unipin-ph": "ludo-club",

  "football-master-2": "football-master-2",
  "football-master-gamepoint": "football-master-2",
  "football-master-unipin-my": "football-master-2",

  "naruto-slugfest": "naruto-slugfest",
  "naruto-slugfest-x-sea-gamepoint": "naruto-slugfest",
  "naruto-slugfestx-unipin-my": "naruto-slugfest",
  "naruto-slugfestx-unipin-ph": "naruto-slugfest",

  "hago": "hago",
  "hago-inquiry": "hago",
  "hago-bangsawan-inquiry": "hago",
  "nhago": "hago",
  "nhagok": "hago",

  "eudemons-online": "eudemons-online",
  "eudemons-online-unipin-my-eudemons-points": "eudemons-online",

  "laplace-m": "laplace-m",
  "laplace-m-unipin-my": "laplace-m",
  "laplace-m-unipin-ph": "laplace-m",

  "metal-slug-awakening": "metal-slug-awakening",
  "metal-slug-awakening-monthly-card": "metal-slug-awakening",
  "metal-slug-awakening-premium-monthly-card": "metal-slug-awakening",

  "saint-seiya": "saint-seiya",
  "saint-seiya-awakening-gamepoint": "saint-seiya",
  "saint-seiya-unipin-ph": "saint-seiya",

  "point-blank": "point-blank",
  "point-blank-unipin-ph": "point-blank",

  "google-play": "google-play",
  "rb-google-play-dgh": "google-play",

  "global-services": "global-services",
  "smile-non-indo": "global-services",
  "garena-shell": "global-services",
  "unipin": "global-services",

  "be-the-king": "be-the-king",
  "be-the-king-asia-gamepoint": "be-the-king",
  "be-the-king-europe-gamepoint": "be-the-king",
  "be-the-king-us-gamepoint": "be-the-king",

  "dgh": "dgh",
  "dgr": "dgr",
  "dghmbl": "dghmbl",
  "other": "other"
};

const output = {};
const unmapped = [];

for (const key of Object.keys(master)) {
  const canonical = aliases[key];

  if (!canonical) {
    unmapped.push(key);
    continue;
  }

  output[key] = canonical;
}

fs.writeFileSync(
  "canonical-game-map.json",
  JSON.stringify(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      aliases: output,
      unmapped
    },
    null,
    2
  )
);

console.log("========================================");
console.log("FAIN STORE CANONICAL GAME MAP");
console.log("========================================");
console.log("TOTAL MASTER KEYS :", Object.keys(master).length);
console.log("MAPPED            :", Object.keys(output).length);
console.log("UNMAPPED          :", unmapped.length);

if (unmapped.length) {
  console.log("\n=== UNMAPPED ===");
  unmapped.forEach(x => console.log("-", x));
}

console.log("\nFILE: canonical-game-map.json");
