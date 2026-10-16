const fs = require("fs");

const SOURCE = "operator-report.json";

const targets = [
  { operatorId: 7,   code: "HGDU200X2",          expected: "TOP-UP" },
  { operatorId: 9,   code: "UPMBL296",           expected: "TOP-UP" },

  { operatorId: 32,  code: "HAGO_NEW_KNIGHT",    expected: "SPECIAL" },
  { operatorId: 32,  code: "HAGO_NEW_VISCOUNT",  expected: "SPECIAL" },
  { operatorId: 32,  code: "HAGO_RENEW_KNIGHT",  expected: "SPECIAL" },
  { operatorId: 32,  code: "HAGO_RENEW_VISCOUNT",expected: "SPECIAL" },

  { operatorId: 32,  code: "NHAGO9200",          expected: "TOP-UP" },
  { operatorId: 32,  code: "NHAGO18200",         expected: "TOP-UP" },
  { operatorId: 32,  code: "NHAGO45600",         expected: "TOP-UP" },
  { operatorId: 32,  code: "NHAGO76200",         expected: "TOP-UP" },
  { operatorId: 32,  code: "NHAGO61K",           expected: "TOP-UP" },
  { operatorId: 32,  code: "NHAGO155K",          expected: "TOP-UP" },

  { operatorId: 106, code: "GPGANVA",            expected: "SPECIAL" },

  { operatorId: 107, code: "GPROM72",            expected: "TOP-UP" },
  { operatorId: 107, code: "GPROM145",           expected: "TOP-UP" },
  { operatorId: 107, code: "GPROM373",           expected: "TOP-UP" },
  { operatorId: 107, code: "GPROM748",           expected: "TOP-UP" },

  { operatorId: 132, code: "DGHMBL875",          expected: "TOP-UP" }
];

const data = JSON.parse(
  fs.readFileSync(SOURCE, "utf8")
);

const rows = [];

for (const op of data) {
  for (const p of op.products || []) {
    rows.push({
      operatorId: Number(op.operator_id),
      code: String(p.code ?? ""),
      name: String(p.name ?? ""),
      unit: p.unit,
      price: p.price,
      status: p.status
    });
  }
}

const key = (operatorId, code) =>
  `${operatorId}::${code}`;

const sourceMap = new Map();

for (const row of rows) {
  const k = key(row.operatorId, row.code);

  if (sourceMap.has(k)) {
    throw new Error(`DUPLICATE SOURCE KEY: ${k}`);
  }

  sourceMap.set(k, row);
}

const failures = [];
const resolved = [];

for (const target of targets) {
  const k = key(target.operatorId, target.code);
  const row = sourceMap.get(k);

  if (!row) {
    failures.push(
      `MISSING | operator=${target.operatorId} | code=${target.code}`
    );
    continue;
  }

  const result = {
    ...row,
    expected: target.expected
  };

  if (row.status !== "aktif") {
    failures.push(
      `STATUS_NOT_ACTIVE | operator=${row.operatorId} | code=${row.code} | status=${row.status}`
    );
  }

  if (
    row.operatorId === 132 &&
    row.code === "DGHMBL875" &&
    row.name !== "DGHMBL975"
  ) {
    failures.push(
      `DGHMBL875 NAME MISMATCH | actual=${row.name} | expected source name=DGHMBL975`
    );
  }

  resolved.push(result);
}

const counts = {
  "TOP-UP": resolved.filter(x => x.expected === "TOP-UP").length,
  "SPECIAL": resolved.filter(x => x.expected === "SPECIAL").length,
  "KEEP_REVIEW": 0
};

console.log("========================================");
console.log("FAIN STORE — V4.5 FINAL CLASSIFICATION AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log(`SOURCE          : ${SOURCE}`);
console.log(`TARGETS         : ${targets.length}`);
console.log(`RESOLVED        : ${resolved.length}`);
console.log("");

console.log("========================================");
console.log("FINAL CLASSIFICATION");
console.log("========================================");

for (const r of resolved) {
  const anomaly =
    r.operatorId === 132 &&
    r.code === "DGHMBL875"
      ? " | SOURCE_NAME_ANOMALY"
      : "";

  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.expected} | ${r.name}${anomaly}`
  );
}

console.log("");
console.log("========================================");
console.log("TOTALS");
console.log("========================================");

console.log(`TOP-UP        : ${counts["TOP-UP"]}`);
console.log(`SPECIAL       : ${counts["SPECIAL"]}`);
console.log(`KEEP_REVIEW   : ${counts["KEEP_REVIEW"]}`);

console.log("");
console.log("========================================");
console.log("INVARIANTS");
console.log("========================================");

const invariantTargets = resolved.length === 18;
const invariantTopup = counts["TOP-UP"] === 13;
const invariantSpecial = counts["SPECIAL"] === 5;
const invariantReview = counts["KEEP_REVIEW"] === 0;
const invariantDghost =
  resolved.some(
    x =>
      x.operatorId === 132 &&
      x.code === "DGHMBL875" &&
      x.name === "DGHMBL975"
  );

console.log(`18 TARGETS RESOLVED : ${invariantTargets ? "PASS" : "FAIL"}`);
console.log(`TOP-UP = 13        : ${invariantTopup ? "PASS" : "FAIL"}`);
console.log(`SPECIAL = 5        : ${invariantSpecial ? "PASS" : "FAIL"}`);
console.log(`REVIEW = 0         : ${invariantReview ? "PASS" : "FAIL"}`);
console.log(
  `DGHMBL875 ANOMALY  : ${invariantDghost ? "CONFIRMED" : "FAIL"}`
);

console.log("");
console.log("========================================");

if (failures.length) {
  console.log("AUDIT STATUS : FAIL");
  console.log("");
  console.log("FAILURES:");

  for (const failure of failures) {
    console.log(`- ${failure}`);
  }

  console.log("");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");

  process.exit(1);
}

if (
  !invariantTargets ||
  !invariantTopup ||
  !invariantSpecial ||
  !invariantReview ||
  !invariantDghost
) {
  console.log("AUDIT STATUS : FAIL");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
  process.exit(1);
}

console.log("AUDIT STATUS : PASS");
console.log("V4.5 FINAL CLASSIFICATION TERKUNCI");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
