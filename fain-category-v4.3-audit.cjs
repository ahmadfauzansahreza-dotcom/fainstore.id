const fs = require("fs");

const report = JSON.parse(fs.readFileSync("operator-report.json", "utf8"));

const products = [];

for (const op of report) {
  for (const p of op.products || []) {
    products.push({
      operatorId: Number(op.operator_id),
      code: String(p.code ?? ""),
      name: String(p.name ?? ""),
      price: p.price,
      unit: p.unit,
    });
  }
}

const n = s =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/*
 * V4.3
 * READ ONLY
 *
 * Priority:
 * SERVICE/INQUIRY
 * SPECIAL
 * VOUCHER
 * TOP-UP
 * REVIEW
 */

const SERVICE = [
  /\binquiry\b/i,
  /\btokovoucher\b/i,
  /\bbangsawan inquiry\b/i,
];

const SPECIAL = [
  /\bweekly diamond pass\b/i,
  /\bweekly pass\b/i,
  /\btwilight pass\b/i,
  /\bstarlight member\b/i,
  /\bstarlight\b/i,
  /\bmember\b/i,
  /\bmembership\b/i,
  /\bbattle pass\b/i,
  /\bbp card\b/i,
  /\bupgrade pass\b/i,
  /\bupgrade awards\b/i,
  /\bpromotion pass\b/i,
  /\bpremium pass\b/i,
  /\bmonthly pass\b/i,
  /\bmonthly card\b/i,
  /\bgrowth fund\b/i,
  /\binvestment fund\b/i,
  /\bfestival pack\b/i,
  /\bwebpay gift\b/i,
  /\bnewbie pack\b/i,
  /\bcollector edition pass\b/i,
  /\bbasic pass\b/i,
];

const VOUCHER = [
  /\bvoucher\b/i,
  /\bgift card\b/i,
  /\bgiftcard\b/i,
];

const TOPUP = [
  /\bdiamond\b/i,
  /\bdiamonds\b/i,
  /\bcp\b/i,
  /\bcredits\b/i,
  /\bcoins\b/i,
  /\bgold\b/i,
  /\bpoints\b/i,
  /\bcrystals\b/i,
  /\bcandies\b/i,
  /\bcoupon\b/i,
  /\bcoupons\b/i,
  /\btanium\b/i,
  /\bjades\b/i,
  /\bruby\b/i,
  /\btoken\b/i,
  /\btokens\b/i,
  /\bbadges\b/i,
  /\bspirals\b/i,
  /\bjewels\b/i,
  /\bbanknotes\b/i,
  /\bnyan berry\b/i,
  /\boneiric shard\b/i,
  /\bgenesis crystals\b/i,
  /\bstar credits\b/i,
  /\bgoldstar\b/i,
  /\bstar quartz\b/i,
  /\beudemons points\b/i,
  /\bcash\b/i,
  /\brobux\b/i,
];

function matched(text, rules) {
  return rules
    .filter(r => r.test(text))
    .map(r => r.source);
}

function classify(p) {
  const name = n(p.name);

  const service = matched(name, SERVICE);
  const special = matched(name, SPECIAL);
  const voucher = matched(name, VOUCHER);
  const topup = matched(name, TOPUP);

  let category = "REVIEW";

  if (service.length) {
    category = "SERVICE";
  } else if (special.length) {
    category = "SPECIAL";
  } else if (voucher.length) {
    category = "VOUCHER";
  } else if (topup.length) {
    category = "TOP-UP";
  }

  return {
    ...p,
    category,
    service,
    special,
    voucher,
    topup
  };
}

const rows = products.map(classify);

const counts = {};
for (const r of rows) {
  counts[r.category] = (counts[r.category] || 0) + 1;
}

console.log("========================================");
console.log("FAIN STORE — CATEGORY V4.3");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("TOTAL PRODUCTS :", rows.length);

console.log("\nCATEGORY TOTALS");

for (const c of [
  "SPECIAL",
  "TOP-UP",
  "VOUCHER",
  "SERVICE",
  "REVIEW"
]) {
  console.log(
    c.padEnd(12),
    ":",
    counts[c] || 0
  );
}

console.log("\n========================================");
console.log("SERVICE / INQUIRY");
console.log("========================================");

for (const r of rows.filter(x => x.category === "SERVICE")) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("\n========================================");
console.log("REVIEW PRODUCTS");
console.log("========================================");

const review = rows.filter(x => x.category === "REVIEW");

for (const r of review) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("\n========================================");
console.log("SPECIAL SAMPLE");
console.log("========================================");

for (const r of rows.filter(x => x.category === "SPECIAL").slice(0, 40)) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("\n========================================");
console.log("VOUCHER SAMPLE");
console.log("========================================");

for (const r of rows.filter(x => x.category === "VOUCHER").slice(0, 30)) {
  console.log(
    `operator=${r.operatorId} | ${r.code} | ${r.name}`
  );
}

console.log("\n========================================");
console.log("CATEGORY V4.3 SELESAI");
console.log("READ ONLY — DATABASE TIDAK DIUBAH");
console.log("========================================");
