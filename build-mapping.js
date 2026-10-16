const fs = require("fs");

const input = "./data-produk-10-08-26.json";

if (!fs.existsSync(input)) {
  console.error("❌ File tidak ditemukan:", input);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(input, "utf8"));

const rules = [
  ["FREE_FIRE", ["free fire", "diamond ff"]],
  ["MOBILE_LEGENDS", ["mobile legend", "diamond mobile legend", "mlbb"]],
  ["CALL_OF_DUTY", ["call of duty", "codm", "cp cod"]],
  ["GENSHIN_IMPACT", ["genshin impact", "genesis crystal"]],
  ["HONKAI_STAR_RAIL", ["honkai", "oneiric shard"]],
  ["DRAGON_RAJA", ["dragon raja"]],
  ["RAGNAROK", ["ragnarok"]],
  ["MU_ORIGIN", ["mu origin"]],
  ["LORDS_MOBILE", ["lords mobile"]],
  ["SAUSAGE_MAN", ["sausage man"]],
  ["OMEGA_LEGENDS", ["omega legends"]],
  ["TOM_AND_JERRY", ["tom and jerry"]],
  ["TANIUM_TOWER", ["tanium tower of fantasy", "tower of fantasy"]],
  ["VALORANT", ["valorant", "valorant point"]],
  ["MARVEL_SNAP", ["marvel snap"]],
  ["PROJECT_INTR0PY", ["project entropy"]],
  ["ONE_PUNCH_MAN", ["one punch man"]],
  ["SAINT_SEIYA", ["saint seiya"]],
  ["FOOTBALL_MASTER", ["football master"]],
  ["POINT_BLANK", ["point blank"]],
  ["NARUTO", ["naruto"]],
  ["DEVINE_DIAMONDS", ["devine diamonds"]],
  ["EDUEMONS", ["eduemons"]],
  ["LAPLACE_M", ["laplace m"]],
  ["ACE_RACER", ["ace racer"]],
  ["BIGOLIVE", ["bigo live"]],
  ["MANGO_LIVE", ["mango live"]],
  ["SUGIFESTX", ["slugfestx"]],
  ["GARENA", ["garena shell"]],
  ["GOOGLE_PLAY", ["google play"]],
  ["HARRY_POTTER", ["harry potter"]],
  ["METAL_SLUG", ["metal slug"]],
  ["KIOSGAMER", ["kiosgamer"]],
];

function detectGame(name) {
  const text = String(name || "").toLowerCase();

  for (const [game, keywords] of rules) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return game;
    }
  }

  return "NEEDS_REVIEW";
}

const operators = new Map();

for (const item of data) {
  const operatorId = String(item.operator_id);

  if (!operators.has(operatorId)) {
    operators.set(operatorId, {
      operator_id: item.operator_id,
      detected_games: new Set(),
      total_products: 0,
      samples: []
    });
  }

  const op = operators.get(operatorId);
  const game = detectGame(item.nama);

  op.detected_games.add(game);
  op.total_products++;

  if (op.samples.length < 5) {
    op.samples.push({
      kode_produk: item.kode_produk,
      nama: item.nama,
      game
    });
  }
}

const result = [...operators.values()]
  .sort((a, b) => Number(a.operator_id) - Number(b.operator_id))
  .map(op => ({
    operator_id: op.operator_id,
    total_products: op.total_products,
    detected_games: [...op.detected_games],
    samples: op.samples
  }));

fs.writeFileSync(
  "./operator-mapping.json",
  JSON.stringify(result, null, 2)
);

const review = result.filter(
  x =>
    x.detected_games.includes("NEEDS_REVIEW") ||
    x.detected_games.length > 1
);

fs.writeFileSync(
  "./operator-needs-review.json",
  JSON.stringify(review, null, 2)
);

console.log("======================================");
console.log(" FAIN STORE - OPERATOR MAPPING");
console.log("======================================");
console.log("Total produk   :", data.length);
console.log("Total operator :", result.length);
console.log("Perlu review   :", review.length);
console.log("");
console.log("File dibuat:");
console.log("1. operator-mapping.json");
console.log("2. operator-needs-review.json");
console.log("");
console.log("⚠️ BELUM ADA DATA DATABASE YANG DIUBAH.");
