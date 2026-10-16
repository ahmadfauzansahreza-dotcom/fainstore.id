const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("operator-report.json", "utf8")
);

const targets = new Set([
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
]);

function trace(name) {
  const n = String(name || "").toLowerCase().trim();

  return {
    service:
      /\binquiry\b/i.test(n) ||
      /\btokovoucher\b/i.test(n),

    special: [
      /\bweekly diamond pass\b/i,
      /\bweekly pass\b/i,
      /\btwilight(?:\s+pass)?\b/i,
      /\bstarlight\b/i,
      /\bmembership\b/i,
      /\bmember\b/i,
      /\bbattle pass\b/i,
      /\bbp card\b/i,
      /\bupgrade pass\b/i,
      /\bupgrade awards\b/i,
      /\bpremium pass\b/i,
      /\bmonthly pass\b/i,
      /\bmonthly card\b/i,
      /\bgrowth fund\b/i,
      /\binvestment fund\b/i,
      /\bfestival pack\b/i,
      /\bwebpay gift\b/i,
      /\bnewbie pack\b/i,
      /\blimited special gift\b/i,
      /\bdaily specials\b/i,
      /\bdaily feedback\b/i,
      /\bdaily selection\b/i,
      /\bsenior adventurer\b/i,
      /\bgreat adventurer\b/i,
      /\bblessing of the welkin moon\b/i,
      /\brookie supplies\b/i,
      /\badventure pack\b/i,
      /\bbasic pass\b/i,
      /\bcollector edition pass\b/i,
      /\bexpress supply pass\b/i,
      /\bpembelian 7 hari revelation gifts\b/i,
      /\bbangsawan\b/i,
      /\bkartu mingguan\b/i,
      /\bkartu bulanan\b/i,
      /\bglory pass\b/i,
      /\bpasse de grande valor\b/i
    ].filter(r => r.test(n)).map(r => r.source),

    voucher: [
      /\bvouchers?\b/i,
      /\bgift card\b/i,
      /\bgiftcard\b/i
    ].filter(r => r.test(n)).map(r => r.source),

    topup: [
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
      /\bcoupuns\b/i,
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
      /\buc\b/i,
      /\bjade\b/i,
      /\brc\b/i,
      /\bstar chips\b/i,
      /\bfmp\b/i,
      /\bgem\b/i,
      /\bgems\b/i,
      /\bgolden star\b/i,
      /\b200m\b/i,
      /\b9200\b/i,
      /\b18200\b/i,
      /\b45600\b/i,
      /\b76200\b/i,
      /\b61k\b/i,
      /\b155k\b/i
    ].filter(r => r.test(n)).map(r => r.source)
  };
}

console.log("========================================");
console.log("FAIN STORE — V4.9.3 RULE TRACE");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

for (const op of data) {
  for (const p of op.products || []) {
    if (!targets.has(p.code)) continue;

    const t = trace(p.name);

    console.log("");
    console.log(`operator=${op.operator_id}`);
    console.log(`code=${p.code}`);
    console.log(`name=${p.name}`);
    console.log(`SERVICE : ${JSON.stringify(t.service)}`);
    console.log(`SPECIAL : ${JSON.stringify(t.special)}`);
    console.log(`VOUCHER : ${JSON.stringify(t.voucher)}`);
    console.log(`TOPUP   : ${JSON.stringify(t.topup)}`);
  }
}

console.log("");
console.log("========================================");
console.log("RULE TRACE SELESAI");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
