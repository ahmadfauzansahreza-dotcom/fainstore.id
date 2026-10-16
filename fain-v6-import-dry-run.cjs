const fs = require("fs");

const catalog = JSON.parse(
  fs.readFileSync("./FAIN_STORE_CATALOG_FINAL_V6.json", "utf8")
);

const products = catalog.allProducts || [];
const games = catalog.games || [];

console.log("========================================");
console.log("FAIN STORE — V6 IMPORT DRY RUN");
console.log("DATABASE WRITE : 0");
console.log("========================================");
console.log("");

console.log("CATALOG PRODUCTS :", products.length);
console.log("CATALOG GAMES    :", games.length);
console.log("UNRESOLVED       :", catalog.unresolvedProducts?.length ?? 0);
console.log("");

const classifications = {};
const gameCounts = {};

for (const p of products) {
  classifications[p.classification] =
    (classifications[p.classification] || 0) + 1;

  if (p.game) {
    gameCounts[p.game] = (gameCounts[p.game] || 0) + 1;
  }
}

console.log("=== CLASSIFICATION ===");

for (const [key, value] of Object.entries(classifications)) {
  console.log(`${key.padEnd(12)} : ${value}`);
}

console.log("");
console.log("=== GAME SAMPLE ===");

Object.entries(gameCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([slug, count]) => {
    console.log(`${slug.padEnd(30)} : ${count}`);
  });

console.log("");
console.log("=== PRODUCT SAMPLE ===");

products.slice(0, 10).forEach((p, i) => {
  console.log(
    `${String(i + 1).padStart(2)} | ` +
    `${p.sourceCode} | ` +
    `${p.gameName || "GLOBAL"} | ` +
    `${p.classification} | ` +
    `${p.priceIdr}`
  );
});

console.log("");
console.log("=== INVARIANTS ===");

const codes = products.map((p) => p.sourceCode);
const duplicateCodes = codes.length - new Set(codes).size;

console.log("TOTAL PRODUCTS :", products.length);
console.log("TOTAL GAMES    :", games.length);
console.log("UNRESOLVED     :", catalog.unresolvedProducts?.length ?? 0);
console.log("DUPLICATE CODE :", duplicateCodes);
console.log("DATABASE WRITE :", 0);

console.log("");
console.log("========================================");

if (
  products.length !== 1347 ||
  (catalog.unresolvedProducts?.length ?? 0) !== 0 ||
  duplicateCodes !== 0
) {
  console.log("DRY RUN STATUS : REVIEW REQUIRED");
  process.exitCode = 1;
} else {
  console.log("DRY RUN STATUS : PASS");
}

console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
