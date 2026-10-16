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
console.log("FAIN STORE — V4.10.1 DERIVED CLASSIFICATION");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

const rows = (data.products || []).filter(p =>
  targets.has(p.name)
);

for (const p of rows) {
  const game = String(p.game?.name || "");
  const slug = String(p.game?.slug || "");

  const derived =
    ["NHAGO", "NHAGOK"].includes(game) &&
    ["nhago", "nhagok"].includes(slug)
      ? "TOP-UP"
      : "REVIEW";

  console.log(
    `name=${p.name} | ` +
    `game=${game} | ` +
    `slug=${slug} | ` +
    `sourceClassification=${p.classification ?? "NULL"} | ` +
    `derivedClassification=${derived} | ` +
    `reason=HAGO_DENOMINATION_PRODUCT`
  );
}

console.log("");
console.log("TARGETS :", rows.length);
console.log("DERIVED TOP-UP :", rows.filter(p =>
  ["NHAGO", "NHAGOK"].includes(String(p.game?.name || "")) &&
  ["nhago", "nhagok"].includes(String(p.game?.slug || ""))
).length);

console.log("DATABASE WRITE : 0");

console.log("");
console.log("========================================");
console.log("SOURCE CLASSIFICATION : PRESERVED");
console.log("DERIVED CLASSIFICATION : AUDIT ONLY");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
