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

const normalize = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const SPECIAL = [
  /\bmember\b/i,
  /\bmembership\b/i,
  /\bstarlight\b/i,
  /\btwilight\b/i,
  /\bweekly pass\b/i,
  /\bweekly diamond pass\b/i,
  /\bbattle pass\b/i,
  /\bbp card\b/i,
  /\bupgrade pass\b/i,
  /\bupgrade awards\b/i,
  /\bpromotion pass\b/i,
  /\bfestival pack\b/i,
  /\bwebpay gift\b/i,
  /\bnewbie pack\b/i,
  /\bpremium pass\b/i,
  /\bgrowth fund\b/i,
  /\bglory pass\b/i,
  /\bmonthly pass\b/i,
  /\bmonthly card\b/i,
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
  /\bgolden star\b/i,
  /\bstar quartz\b/i,
  /\beudemons points\b/i,
  /\bcash\b/i,
];

function hits(name, rules) {
  return rules
    .filter((r) => r.test(name))
    .map((r) => r.source);
}

function classify(p) {
  const n = normalize(p.name);

  const special = hits(n, SPECIAL);
  const voucher = hits(n, VOUCHER);
  const topup = hits(n, TOPUP);

  const buckets = [];

  if (special.length) buckets.push("special-items");
  if (voucher.length) buckets.push("voucher");
  if (topup.length) buckets.push("top-up-instant");

  return {
    ...p,
    buckets,
    special,
    voucher,
    topup,
  };
}

const results = products.map(classify);

const conflicts = results.filter(x => x.buckets.length > 1);
const noCategory = results.filter(x => x.buckets.length === 0);

console.log("========================================");
console.log("FAIN STORE — CATEGORY V4.2 AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("TOTAL PRODUCTS :", results.length);
console.log("CATEGORY CONFLICTS :", conflicts.length);
console.log("NO CATEGORY :", noCategory.length);

console.log("\n========================================");
console.log("CATEGORY TOTALS");
console.log("========================================");

for (const category of [
  "special-items",
  "top-up-instant",
  "voucher",
]) {
  console.log(
    category.toUpperCase().padEnd(18),
    results.filter(x => x.buckets.includes(category)).length
  );
}

console.log("\n========================================");
console.log("5 CATEGORY CONFLICT / ALL CONFLICTS");
console.log("========================================");

for (const p of conflicts) {
  console.log(
    `operator=${p.operatorId}` +
    ` | code=${p.code}` +
    ` | name=${p.name}` +
    ` | buckets=${p.buckets.join(",")}` +
    ` | special=${p.special.length}` +
    ` | voucher=${p.voucher.length}` +
    ` | topup=${p.topup.length}`
  );
}

console.log("\n========================================");
console.log("NO CATEGORY — GROUP BY OPERATOR");
console.log("========================================");

const operatorMap = new Map();

for (const p of noCategory) {
  if (!operatorMap.has(p.operatorId)) {
    operatorMap.set(p.operatorId, []);
  }

  operatorMap.get(p.operatorId).push(p);
}

for (const [operator, rows] of operatorMap) {
  console.log(
    `operator=${operator} | count=${rows.length}`
  );

  for (const p of rows.slice(0, 15)) {
    console.log(
      `  ${p.code} | ${p.name}`
    );
  }

  if (rows.length > 15) {
    console.log(
      `  ... ${rows.length - 15} more`
    );
  }
}

console.log("\n========================================");
console.log("IMPORTANT PRODUCT GROUPS");
console.log("========================================");

const checks = [
  ["AOV", /aov/i],
  ["POINT BLANK", /point blank|pb cash/i],
  ["TOKOVOUCHER", /tokovoucher/i],
  ["HAGO", /hago/i],
  ["CODM", /call of duty|codm/i],
  ["LORDS MOBILE", /lords mobile/i],
  ["GENSHIN", /genshin impact/i],
  ["DRAGON RAJA", /dragon raja/i],
  ["OMEGA LEGENDS", /omega legends/i],
  ["HIGGS", /higgs domino/i],
  ["INQUIRY", /inquiry/i],
  ["GOOGLE PLAY", /google play/i],
];

for (const [label, regex] of checks) {
  const rows = noCategory.filter(p => regex.test(p.name));

  console.log(`\n--- ${label}: ${rows.length} ---`);

  for (const p of rows.slice(0, 20)) {
    console.log(
      `${p.code} | ${p.name}`
    );
  }
}

console.log("\n========================================");
console.log("NO CATEGORY SAMPLE");
console.log("========================================");

for (const p of noCategory.slice(0, 100)) {
  console.log(
    `operator=${p.operatorId}` +
    ` | code=${p.code}` +
    ` | name=${p.name}`
  );
}

console.log("\n========================================");
console.log("CATEGORY V4.2 AUDIT SELESAI");
console.log("READ ONLY — DATABASE TIDAK DIUBAH");
console.log("========================================");
