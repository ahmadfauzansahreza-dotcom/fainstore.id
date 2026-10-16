const fs = require("fs");

const report = JSON.parse(fs.readFileSync("operator-report.json", "utf8"));
const dgh = JSON.parse(fs.readFileSync("dgh-source-locked-overrides.json", "utf8"));

const resolved = {
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
  GPROM748: "TOP-UP"
};

for (const [code, data] of Object.entries(dgh)) {
  resolved[code] = data.classification;
}

const targets = [
  "UPMBL296",
  "NHAGO9200",
  "NHAGO18200",
  "NHAGO45600",
  "NHAGO76200",
  "NHAGO61K",
  "NHAGO155K",
  "UPMYPPNVA",
  "UPHPPNVA",
  "GPPPNVA",
  "GPGANVA",
  "GPROM72",
  "GPROM145",
  "GPROM373",
  "GPROM748",
  "DGHAOV40",
  "DGHAOV90",
  "DGHAOV230",
  "DGHAOV470",
  "DGHAOV950",
  "DGHAOV1430",
  "DGHAOV2390",
  "DGHMBL875"
];

const source = new Map();

for (const op of report) {
  for (const p of op.products || []) {
    source.set(p.code, {
      operator: op.operator_id,
      name: p.name,
      status: p.status
    });
  }
}

console.log("========================================");
console.log("FAIN STORE — V4.11 SOURCE-LOCKED RESOLUTION");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");
console.log("");

let missing = 0;
let duplicate = 0;
const seen = new Set();

for (const code of targets) {
  const p = source.get(code);

  if (!p) {
    console.log(`MISSING SOURCE | ${code}`);
    missing++;
    continue;
  }

  if (seen.has(code)) duplicate++;
  seen.add(code);

  console.log(
    `operator=${p.operator} | code=${code} | ` +
    `classification=${resolved[code] || "UNRESOLVED"} | ` +
    `name=${p.name} | status=${p.status}`
  );
}

const unresolved = targets.filter(code => !resolved[code]);

console.log("");
console.log("========================================");
console.log("INVARIANTS");
console.log("========================================");
console.log(`TARGETS        : ${targets.length}`);
console.log(`RESOLVED       : ${targets.length - unresolved.length}`);
console.log(`UNRESOLVED     : ${unresolved.length}`);
console.log(`MISSING SOURCE : ${missing}`);
console.log(`DUPLICATE CODE : ${duplicate}`);
console.log("DATABASE WRITE : 0");

console.log("");
console.log("========================================");
console.log(
  "AUDIT STATUS : " +
  (unresolved.length === 0 && missing === 0 && duplicate === 0
    ? "PASS"
    : "REVIEW REQUIRED")
);
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
