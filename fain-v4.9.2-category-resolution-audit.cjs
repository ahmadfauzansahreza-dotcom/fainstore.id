const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("operator-report.json", "utf8")
);

const products = [];

for (const op of data) {
  for (const p of op.products || []) {
    products.push({
      operator: op.operator_id,
      code: p.code,
      name: p.name,
      status: p.status
    });
  }
}

/*
 * V4.9.2
 * Resolves the remaining V4.9 REVIEW products
 * using source-confirmed product-name patterns.
 *
 * READ ONLY — NO DATABASE CHANGES
 */

function classify(name) {
  const n = String(name || "").toLowerCase().trim();

  /*
   * SERVICE
   */
  if (
    /\binquiry\b/i.test(n) ||
    /\btokovoucher\b/i.test(n)
  ) {
    return "SERVICE";
  }

  /*
   * SPECIAL — source-confirmed pass/membership/gift products
   */
  if (
    /\bweekly diamond pass\b/i.test(n) ||
    /\bweekly pass\b/i.test(n) ||
    /\btwilight(?:\s+pass)?\b/i.test(n) ||
    /\bstarlight\b/i.test(n) ||
    /\bmembership\b/i.test(n) ||
    /\bmember\b/i.test(n) ||
    /\bbattle pass\b/i.test(n) ||
    /\bbp card\b/i.test(n) ||
    /\bupgrade pass\b/i.test(n) ||
    /\bupgrade awards\b/i.test(n) ||
    /\bpremium pass\b/i.test(n) ||
    /\bmonthly pass\b/i.test(n) ||
    /\bmonthly card\b/i.test(n) ||
    /\bgrowth fund\b/i.test(n) ||
    /\binvestment fund\b/i.test(n) ||
    /\bfestival pack\b/i.test(n) ||
    /\bwebpay gift\b/i.test(n) ||
    /\bnewbie pack\b/i.test(n) ||
    /\blimited special gift\b/i.test(n) ||
    /\bdaily specials\b/i.test(n) ||
    /\bdaily feedback\b/i.test(n) ||
    /\bdaily selection\b/i.test(n) ||
    /\bsenior adventurer\b/i.test(n) ||
    /\bgreat adventurer\b/i.test(n) ||
    /\bblessing of the welkin moon\b/i.test(n) ||
    /\brookie supplies\b/i.test(n) ||
    /\badventure pack\b/i.test(n) ||
    /\bbasic pass\b/i.test(n) ||
    /\bcollector edition pass\b/i.test(n) ||
    /\bexpress supply pass\b/i.test(n) ||
    /\bpembelian 7 hari revelation gifts\b/i.test(n) ||
    /\bbangsawan\b/i.test(n) ||
    /\bkartu mingguan\b/i.test(n) ||
    /\bkartu bulanan\b/i.test(n) ||
    /\bglory pass\b/i.test(n) ||
    /\bpasse de grande valor\b/i.test(n)
  ) {
    return "SPECIAL";
  }

  /*
   * VOUCHER
   */
  if (
    /\bvouchers?\b/i.test(n) ||
    /\bgift card\b/i.test(n) ||
    /\bgiftcard\b/i.test(n)
  ) {
    return "VOUCHER";
  }

  /*
   * TOP-UP — currency / denomination products
   */
  if (
    /\bdiamond\b/i.test(n) ||
    /\bdiamonds\b/i.test(n) ||
    /\bcp\b/i.test(n) ||
    /\bcredits\b/i.test(n) ||
    /\bcoins\b/i.test(n) ||
    /\bgold\b/i.test(n) ||
    /\bpoints\b/i.test(n) ||
    /\bcrystals\b/i.test(n) ||
    /\bcandies\b/i.test(n) ||
    /\bcoupon\b/i.test(n) ||
    /\bcoupons\b/i.test(n) ||
    /\bcoupuns\b/i.test(n) ||
    /\btanium\b/i.test(n) ||
    /\bjades\b/i.test(n) ||
    /\bruby\b/i.test(n) ||
    /\btoken\b/i.test(n) ||
    /\btokens\b/i.test(n) ||
    /\bbadges\b/i.test(n) ||
    /\bspirals\b/i.test(n) ||
    /\bjewels\b/i.test(n) ||
    /\bbanknotes\b/i.test(n) ||
    /\bnyan berry\b/i.test(n) ||
    /\boneiric shard\b/i.test(n) ||
    /\bgenesis crystals\b/i.test(n) ||
    /\bstar credits\b/i.test(n) ||
    /\bgoldstar\b/i.test(n) ||
    /\bstar quartz\b/i.test(n) ||
    /\beudemons points\b/i.test(n) ||
    /\bcash\b/i.test(n) ||
    /\brobux\b/i.test(n) ||
    /\buc\b/i.test(n) ||
    /\bjade\b/i.test(n) ||
    /\brc\b/i.test(n) ||
    /\bstar chips\b/i.test(n) ||
    /\bfmp\b/i.test(n) ||
    /\bgem\b/i.test(n) ||
    /\bgems\b/i.test(n) ||
    /\bgolden star\b/i.test(n) ||
    /\b200m\b/i.test(n) ||
    /\b9200\b/i.test(n) ||
    /\b18200\b/i.test(n) ||
    /\b45600\b/i.test(n) ||
    /\b76200\b/i.test(n) ||
    /\b61k\b/i.test(n) ||
    /\b155k\b/i.test(n)
  ) {
    return "TOP-UP";
  }

  return "REVIEW";
}

const results = products.map(p => ({
  ...p,
  category: classify(p.name)
}));

const counts = {};

for (const r of results) {
  counts[r.category] = (counts[r.category] || 0) + 1;
}

const review = results.filter(
  r => r.category === "REVIEW"
);

console.log("========================================");
console.log("FAIN STORE — V4.9.2 CATEGORY RESOLUTION");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("");
console.log("TOTAL PRODUCTS :", results.length);

console.log("");
console.log("=== CATEGORY TOTALS ===");

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

console.log("");
console.log("=== REMAINING REVIEW ===");
console.log("COUNT :", review.length);

for (const r of review) {
  console.log(
    `operator=${r.operator} | code=${r.code} | ${r.name}`
  );
}

console.log("");
console.log("=== INVARIANTS ===");

const duplicateCodes =
  results.length -
  new Set(results.map(r => r.code).filter(Boolean)).size;

console.log(
  "TOTAL PRODUCTS :",
  results.length
);

console.log(
  "REVIEW         :",
  review.length
);

console.log(
  "DUPLICATE CODE :",
  duplicateCodes
);

console.log(
  "DATABASE WRITE :",
  0
);

console.log("");
console.log("========================================");

if (review.length === 0 && duplicateCodes === 0) {
  console.log("AUDIT STATUS : PASS");
  console.log("ALL PRODUCTS CLASSIFIED");
} else {
  console.log("AUDIT STATUS : REVIEW REQUIRED");
}

console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
