const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("operator-report.json", "utf8")
);

const locked = new Map([
  ["HGDU200X2", "TOP-UP"],
  ["UPMBL296", "TOP-UP"],

  ["HAGO_NEW_KNIGHT", "SPECIAL"],
  ["HAGO_NEW_VISCOUNT", "SPECIAL"],
  ["HAGO_RENEW_KNIGHT", "SPECIAL"],
  ["HAGO_RENEW_VISCOUNT", "SPECIAL"],

  ["NHAGO9200", "AMBIGUOUS"],
  ["NHAGO18200", "AMBIGUOUS"],
  ["NHAGO45600", "AMBIGUOUS"],
  ["NHAGO76200", "AMBIGUOUS"],
  ["NHAGO61K", "AMBIGUOUS"],
  ["NHAGO155K", "AMBIGUOUS"],

  ["GPGANVA", "SPECIAL"],

  ["GPROM72", "TOP-UP"],
  ["GPROM145", "TOP-UP"],
  ["GPROM373", "TOP-UP"],
  ["GPROM748", "TOP-UP"],

  ["DGHMBL875", "TOP-UP"]
]);

console.log("========================================");
console.log("FAIN STORE — V4.9.5 SOURCE LOCK AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

let found = 0;

for (const op of data) {
  for (const p of op.products || []) {
    if (!locked.has(p.code)) continue;

    found++;

    console.log(
      `operator=${op.operator_id} | code=${p.code} | ` +
      `source_name=${p.name} | ` +
      `SOURCE_CLASS=${locked.get(p.code)}`
    );
  }
}

console.log("");
console.log("TARGETS DEFINED :", locked.size);
console.log("TARGETS FOUND   :", found);

console.log("");
console.log("=== AMBIGUOUS SOURCE ITEMS ===");

for (const [code, category] of locked) {
  if (category === "AMBIGUOUS") {
    console.log(code);
  }
}

console.log("");
console.log("DATABASE WRITE : 0");
console.log("DATABASE TIDAK DIUBAH");

console.log("========================================");
