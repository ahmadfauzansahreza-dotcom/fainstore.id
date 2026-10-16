const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("operator-report.json", "utf8")
);

const rows = [];

for (const op of data) {
  for (const p of op.products || []) {
    rows.push({
      operator: op.operator_id,
      code: p.code,
      name: p.name,
      status: p.status,
    });
  }
}

function classify(name) {
  const n = String(name || "").toLowerCase();

  if (
    /\binquiry\b/i.test(n) ||
    /\btokovoucher\b/i.test(n)
  ) return "SERVICE";

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
  ) return "SPECIAL";

  if (
    /\bvoucher\b/i.test(n) ||
    /\bgift card\b/i.test(n) ||
    /\bgiftcard\b/i.test(n)
  ) return "VOUCHER";

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
  ) return "TOP-UP";

  return "REVIEW";
}

const review = rows.filter(
  p => classify(p.name) === "REVIEW"
);

const byOperator = {};

for (const p of review) {
  if (!byOperator[p.operator]) {
    byOperator[p.operator] = [];
  }

  byOperator[p.operator].push(p);
}

console.log("========================================");
console.log("FAIN STORE — V4.9.1 REVIEW GROUP AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("");
console.log("REVIEW TOTAL :", review.length);

console.log("");
console.log("=== REVIEW BY OPERATOR ===");

for (const [operator, products] of Object.entries(byOperator)
  .sort((a, b) => b[1].length - a[1].length)) {

  console.log("");
  console.log(`OPERATOR=${operator} | PRODUCTS=${products.length}`);

  for (const p of products) {
    console.log(
      `  ${p.code} | ${p.name} | status=${p.status}`
    );
  }
}

console.log("");
console.log("========================================");
console.log("AUDIT STATUS : READ ONLY");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
