const fs = require("fs");

const SOURCE = "operator-report.json";

if (!fs.existsSync(SOURCE)) {
  console.error("SOURCE TIDAK DITEMUKAN:", SOURCE);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(SOURCE, "utf8"));

const products = [];

for (const op of data) {
  for (const p of op.products || []) {
    products.push({
      operator_id: op.operator_id,
      code: p.code,
      name: p.name,
      status: p.status,
    });
  }
}

console.log("========================================");
console.log("FAIN STORE — V4.9 CATEGORY RESOLUTION");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("");
console.log("SOURCE :", SOURCE);
console.log("PRODUCTS :", products.length);

const categories = {
  "SPECIAL": [],
  "VOUCHER": [],
  "TOP-UP": [],
  "REVIEW": []
};

function classify(name) {
  const n = String(name || "").toLowerCase();

  // SERVICE / inquiry
  if (
    /\binquiry\b/i.test(n) ||
    /\btokovoucher\b/i.test(n)
  ) {
    return "SERVICE";
  }

  // SPECIAL
  if (
    /\bweekly diamond pass\b/i.test(n) ||
    /\bweekly pass\b/i.test(n) ||
    /\btwilight pass\b/i.test(n) ||
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
    /\bnewbie pack\b/i.test(n)
  ) {
    return "SPECIAL";
  }

  // VOUCHER
  if (
    /\bvoucher\b/i.test(n) ||
    /\bgift card\b/i.test(n) ||
    /\bgiftcard\b/i.test(n)
  ) {
    return "VOUCHER";
  }

  // TOP-UP
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
    /\bjade\b/i.test(n)
  ) {
    return "TOP-UP";
  }

  return "REVIEW";
}

const results = products.map(p => ({
  ...p,
  category: classify(p.name)
}));

for (const r of results) {
  if (!categories[r.category]) {
    categories[r.category] = [];
  }

  categories[r.category].push(r);
}

console.log("");
console.log("=== CATEGORY TOTALS ===");

for (const category of [
  "SPECIAL",
  "TOP-UP",
  "VOUCHER",
  "SERVICE",
  "REVIEW"
]) {
  console.log(
    category.padEnd(12),
    ":",
    categories[category]?.length || 0
  );
}

console.log("");
console.log("=== REVIEW PRODUCTS ===");

for (const r of categories.REVIEW || []) {
  console.log(
    `operator=${r.operator_id} | code=${r.code} | ${r.name}`
  );
}

console.log("");
console.log("=== INVARIANTS ===");

const unmapped = results.filter(
  r => !r.category || r.category === "REVIEW"
).length;

const duplicateCodes =
  results.length -
  new Set(results.map(r => r.code).filter(Boolean)).size;

console.log("TOTAL PRODUCTS :", results.length);
console.log("UNMAPPED       :", unmapped);
console.log("DUPLICATE CODE :", duplicateCodes);
console.log("DATABASE WRITE  : 0");

console.log("");
console.log("========================================");

if (unmapped === 0 && duplicateCodes === 0) {
  console.log("AUDIT STATUS : PASS");
} else {
  console.log("AUDIT STATUS : REVIEW REQUIRED");
}

console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
