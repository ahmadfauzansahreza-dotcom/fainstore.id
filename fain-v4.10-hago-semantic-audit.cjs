const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("catalog-products.json", "utf8")
);

const targets = new Set([
  "NHAGO9200",
  "NHAGO18200",
  "NHAGO45600",
  "NHAGO76200",
  "NHAGO61K",
  "NHAGO155K"
]);

console.log("========================================");
console.log("FAIN STORE — V4.10 HAGO SEMANTIC AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("");
console.log("=== ALL HAGO PRODUCTS ===");

const rows = (data.products || []).filter(p => {
  const game = String(p.game?.name || "").toLowerCase();
  const slug = String(p.game?.slug || "").toLowerCase();

  return (
    game === "hago" ||
    game === "nhago" ||
    game === "nhagok" ||
    slug === "hago" ||
    slug === "nhago" ||
    slug === "nhagok"
  );
});

console.log("TOTAL HAGO-RELATED PRODUCTS :", rows.length);

for (const p of rows) {
  console.log(
    `name=${p.name} | price=${p.priceIdr} | ` +
    `classification=${p.classification ?? "NULL"} | ` +
    `parentSlug=${p.parentSlug ?? "NULL"} | ` +
    `reason=${p.classificationReason ?? "NULL"} | ` +
    `game=${p.game?.name ?? "NULL"} | ` +
    `slug=${p.game?.slug ?? "NULL"}`
  );
}

console.log("");
console.log("=== TARGETS ===");

for (const p of rows) {
  if (targets.has(p.name)) {
    console.log(
      `TARGET | ${p.name} | classification=${p.classification ?? "NULL"} | ` +
      `game=${p.game?.name ?? "NULL"} | slug=${p.game?.slug ?? "NULL"}`
    );
  }
}

console.log("");
console.log("=== CLASSIFICATION TOTALS ===");

const counts = {};

for (const p of rows) {
  const c = p.classification ?? "NULL";
  counts[c] = (counts[c] || 0) + 1;
}

for (const [c, n] of Object.entries(counts)) {
  console.log(`${c} : ${n}`);
}

console.log("");
console.log("========================================");
console.log("V4.10 HAGO SEMANTIC AUDIT SELESAI");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
