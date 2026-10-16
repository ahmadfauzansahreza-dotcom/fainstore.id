const { execFileSync } = require("child_process");

const output = execFileSync(
  "node",
  ["--env-file=.env", "./fain-category-v4.3-audit.cjs"],
  { encoding: "utf8" }
);

const lines = output
  .split("\n")
  .filter(x => x.startsWith("operator="));

const reviewStart = output.indexOf("REVIEW PRODUCTS");
const specialStart = output.indexOf("SPECIAL SAMPLE");

if (reviewStart === -1 || specialStart === -1) {
  console.error("REVIEW BLOCK V4.3 TIDAK DITEMUKAN");
  process.exit(1);
}

const reviewLines = output
  .slice(reviewStart, specialStart)
  .split("\n")
  .filter(x => x.startsWith("operator="));

function classify(line) {
  const m = line.match(/^operator=(\d+)\s+\|\s+([^|]+)\s+\|\s+(.+)$/);

  if (!m) {
    return {
      category: "KEEP_REVIEW",
      line
    };
  }

  const operatorId = Number(m[1]);
  const code = m[2].trim();
  const name = m[3].trim();

  const text = `${code} ${name}`.toLowerCase();

  // ================================
  // SPECIAL — HIGH CONFIDENCE
  // ================================

  const special = [
    /twilight\s+ml/,
    /twilight\s+pass/,
    /passe\s+de\s+grande\s+valor/,
    /blessing\s+of\s+the\s+welkin\s+moon/,
    /rookie\s+supplies/,
    /adventure\s+pack/,
    /daily\s+specials/,
    /daily\s+feedback/,
    /senior\s+adventurer/,
    /daily\s+selection/,
    /great\s+adventurer/,
    /limited\s+special\s+gift/,
    /express\s+supply\s+pass/,
    /kartu\s+mingguan/,
    /kartu\s+bulanan/,
    /glory\s+pass/,
    /revelation\s+gifts/
  ];

  if (special.some(r => r.test(text))) {
    return {
      operatorId,
      code,
      name,
      category: "AUTO_SPECIAL"
    };
  }

  // ================================
  // VOUCHER — HIGH CONFIDENCE
  // ================================

  if (/\bvouchers?\b/i.test(name)) {
    return {
      operatorId,
      code,
      name,
      category: "AUTO_VOUCHER"
    };
  }

  // ================================
  // TOP-UP — HIGH CONFIDENCE
  // ================================

  const topup = [
    /\bdiamond(s)?\b/i,
    /\bcoupuns?\b/i,
    /\bgolden\s+star\b/i,
    /\bfmp\b/i,
    /\bstar\s+chips?\b/i,
    /\bjade\b/i,
    /\bgem(s)?\b/i,
    /\brc\b/i,
    /\buc\b/i,
    /\baov\s+dgh\b/i
  ];

  if (topup.some(r => r.test(name))) {
    return {
      operatorId,
      code,
      name,
      category: "AUTO_TOPUP"
    };
  }

  // ================================
  // UNKNOWN / AMBIGUOUS
  // ================================

  return {
    operatorId,
    code,
    name,
    category: "KEEP_REVIEW"
  };
}

const results = reviewLines.map(classify);

const counts = {
  AUTO_SPECIAL: 0,
  AUTO_TOPUP: 0,
  AUTO_VOUCHER: 0,
  KEEP_REVIEW: 0
};

for (const r of results) {
  counts[r.category]++;
}

console.log("========================================");
console.log("FAIN STORE — V4.4 RESOLVER AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("V4.3 REVIEW PRODUCTS :", results.length);

console.log("");
console.log("========================================");
console.log("RESOLUTION TOTALS");
console.log("========================================");

for (const key of Object.keys(counts)) {
  console.log(key.padEnd(18), ":", counts[key]);
}

console.log("");
console.log("========================================");
console.log("AUTO SPECIAL");
console.log("========================================");

for (const r of results.filter(x => x.category === "AUTO_SPECIAL")) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("");
console.log("========================================");
console.log("AUTO VOUCHER");
console.log("========================================");

for (const r of results.filter(x => x.category === "AUTO_VOUCHER")) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("");
console.log("========================================");
console.log("AUTO TOP-UP");
console.log("========================================");

for (const r of results.filter(x => x.category === "AUTO_TOPUP")) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("");
console.log("========================================");
console.log("KEEP REVIEW");
console.log("========================================");

for (const r of results.filter(x => x.category === "KEEP_REVIEW")) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("");
console.log("========================================");
console.log("V4.4 RESOLVER AUDIT SELESAI");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
