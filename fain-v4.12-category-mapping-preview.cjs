const fs = require("fs");

const products = JSON.parse(
  fs.readFileSync("catalog-products.json", "utf8")
).products || [];

const classification = {
  UPMBL296: "TOP-UP",
  NHAGO9200: "TOP-UP",
  NHAGO18200: "TOP-UP",
  NHAGO45600: "TOP-UP",
  NHAGO76200: "TOP-UP",
  NHAGO61K: "TOP-UP",
  NHAGO155K: "TOP-UP",
  UPMYPPNVA: "SPECIAL",
  UPHPPNVA: "SPECIAL",
  GPPPNVA: "SPECIAL",
  GPGANVA: "SPECIAL",
  GPROM72: "TOP-UP",
  GPROM145: "TOP-UP",
  GPROM373: "TOP-UP",
  GPROM748: "TOP-UP",
  DGHAOV40: "TOP-UP",
  DGHAOV90: "TOP-UP",
  DGHAOV230: "TOP-UP",
  DGHAOV470: "TOP-UP",
  DGHAOV950: "TOP-UP",
  DGHAOV1430: "TOP-UP",
  DGHAOV2390: "TOP-UP",
  DGHMBL875: "TOP-UP"
};

const groups = new Map();

for (const p of products) {
  const game = p.game || {};
  const gameSlug = game.slug || "unknown";
  const gameName = game.name || "Unknown Game";

  const cls = classification[p.name] || p.classification || "UNRESOLVED";

  const key = `${gameSlug}|${cls}`;

  if (!groups.has(key)) {
    groups.set(key, {
      gameSlug,
      gameName,
      classification: cls,
      count: 0
    });
  }

  groups.get(key).count++;
}

console.log("========================================");
console.log("FAIN STORE — V4.12 CATEGORY MAPPING PREVIEW");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");
console.log("");

let total = 0;

for (const g of [...groups.values()].sort(
  (a, b) =>
    a.gameName.localeCompare(b.gameName) ||
    a.classification.localeCompare(b.classification)
)) {
  console.log(
    `${g.gameName} | slug=${g.gameSlug} | ` +
    `classification=${g.classification} | products=${g.count}`
  );

  total += g.count;
}

console.log("");
console.log("========================================");
console.log("TOTAL PRODUCTS :", total);
console.log("MAPPING GROUPS :", groups.size);
console.log("DATABASE WRITE  : 0");
console.log("========================================");
