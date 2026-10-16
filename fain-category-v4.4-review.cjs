const fs = require("fs");

const report = JSON.parse(fs.readFileSync("operator-report.json", "utf8"));

const products = [];

for (const op of report) {
  for (const p of op.products || []) {
    products.push({
      operatorId: Number(op.operator_id),
      code: String(p.code ?? ""),
      name: String(p.name ?? ""),
    });
  }
}

const rules = [
  ["AOV", /aov/i],
  ["POINT_BLANK", /point blank|pb cash/i],
  ["TOKOVOUCHER", /tokovoucher/i],
  ["HAGO", /hago/i],
  ["CODM", /call of duty|codm/i],
  ["LORDS_MOBILE", /lords mobile/i],
  ["GENSHIN", /genshin|welkin/i],
  ["DRAGON_RAJA", /dragon raja/i],
  ["OMEGA_LEGENDS", /omega legends/i],
  ["HIGGS_DOMINO", /higgs domino/i],
  ["TOWER_OF_FANTASY", /tower of fantasy/i],
  ["NEVER_AFTER", /never after|lifeafter/i],
  ["FOOTBALL_MASTER", /football master|fmp/i],
  ["SUPER_SUS", /super sus|goldstar/i],
  ["PROJECT_ENTROPY", /project entropy|star chips/i],
  ["MIRAGE", /mirage.*perfect skyline|jades/i],
  ["NIKKE", /goddess of victory|nikke/i],
  ["MU_ORIGIN", /mu origin/i],
  ["SAUSAGE_MAN", /sausage man|candies/i],
  ["ONE_PUNCH_MAN", /one punch man/i],
  ["SAINT_SEIYA", /saint seiya/i],
  ["GOOGLE_PLAY", /google play/i],
  ["HARRY_POTTER", /harry potter|jewels/i],
  ["METAL_SLUG", /metal slug|ruby/i],
  ["ACE_RACER", /ace racer|tokens/i],
  ["RAGNAROK", /ragnarok|nyan berry|big cat coins/i],
  ["LAPlace_M", /laplace m|spirals/i],
  ["MANGATOON", /mangatoon/i],
  ["BIGO", /bigo live|mango live/i],
  ["LITA", /lita/i],
  ["LUDO_CLUB", /ludo club/i],
  ["Eudemons", /eudemons/i],
  ["BE_THE_KING", /be the king/i],
  ["REVELATION", /revelation/i],
];

const review = products.filter(p => {
  const s = `${p.name} ${p.code}`.toLowerCase();

  // reproduce the current V4.3 REVIEW condition
  const service =
    /\binquiry\b/i.test(s) ||
    /\btokovoucher\b/i.test(s) ||
    /\bbangsawan inquiry\b/i.test(s);

  const special =
    /\bweekly diamond pass\b/i.test(s) ||
    /\bweekly pass\b/i.test(s) ||
    /\btwilight pass\b/i.test(s) ||
    /\bstarlight\b/i.test(s) ||
    /\bmember\b/i.test(s) ||
    /\bbattle pass\b/i.test(s) ||
    /\bupgrade pass\b/i.test(s) ||
    /\bupgrade awards\b/i.test(s) ||
    /\binvestment fund\b/i.test(s) ||
    /\bfestival pack\b/i.test(s);

  const voucher = /\bvoucher\b/i.test(s);

  const topup =
    /\bdiamond\b|\bdiamonds\b|\bcp\b|\bcredits\b|\bcoins\b|\bgold\b|\bpoints\b|\bcrystals\b|\bcandies\b|\bcoupon\b|\bcoupons\b|\btanium\b|\bjades\b|\bruby\b|\btoken\b|\bbadges\b|\bspirals\b|\bjewels\b|\bbanknotes\b|\bnyan berry\b|\boneiric shard\b|\bgenesis crystals\b|\bstar credits\b|\bgoldstar\b|\bstar quartz\b|\beudemons points\b|\bcash\b/i.test(s);

  return !service && !special && !voucher && !topup;
});

console.log("========================================");
console.log("FAIN STORE — V4.4 REVIEW RESOLVER");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("REVIEW PRODUCTS :", review.length);

console.log("\n========================================");
console.log("REVIEW BY GAME / KEYWORD");
console.log("========================================");

const assigned = new Set();

for (const [label, regex] of rules) {
  const rows = review.filter(p => regex.test(`${p.name} ${p.code}`));

  if (!rows.length) continue;

  console.log(`\n--- ${label}: ${rows.length} ---`);

  for (const p of rows) {
    assigned.add(p.code);
    console.log(
      `operator=${p.operatorId} | ${p.code} | ${p.name}`
    );
  }
}

console.log("\n========================================");
console.log("UNMATCHED REVIEW");
console.log("========================================");

const unmatched = review.filter(p => !assigned.has(p.code));

console.log("COUNT :", unmatched.length);

for (const p of unmatched) {
  console.log(
    `operator=${p.operatorId} | ${p.code} | ${p.name}`
  );
}

console.log("\n========================================");
console.log("V4.4 AUDIT SELESAI");
console.log("READ ONLY");
console.log("========================================");
