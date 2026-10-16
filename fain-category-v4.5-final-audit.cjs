const { execFileSync } = require("child_process");

function run(script) {
  return execFileSync(
    "node",
    ["--env-file=.env", script],
    { encoding: "utf8" }
  );
}

function parseReview(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    throw new Error(
      `REVIEW boundary tidak ditemukan: ${startMarker} -> ${endMarker}`
    );
  }

  const block = text.slice(start, end);
  const rows = [];

  for (const line of block.split("\n")) {
    const m = line.match(
      /^operator=(\d+)\s+\|\s+([^\|]+)\s+\|\s+(.+)$/
    );

    if (!m) continue;

    rows.push({
      operatorId: Number(m[1]),
      code: m[2].trim(),
      name: m[3].trim()
    });
  }

  return rows;
}

const v43 = parseReview(
  run("fain-category-v4.3-audit.cjs"),
  "REVIEW PRODUCTS",
  "SPECIAL SAMPLE"
);

const targets = new Set([
  "HGDU200X2",
  "UPMBL296",

  "HAGO_NEW_KNIGHT",
  "HAGO_NEW_VISCOUNT",
  "HAGO_RENEW_KNIGHT",
  "HAGO_RENEW_VISCOUNT",
  "NHAGO9200",
  "NHAGO18200",
  "NHAGO45600",
  "NHAGO76200",
  "NHAGO61K",
  "NHAGO155K",

  "GPGANVA",

  "GPROM72",
  "GPROM145",
  "GPROM373",
  "GPROM748",

  "DGHMBL875"
]);

const keepReview = v43.filter(x => targets.has(x.code));

console.log("========================================");
console.log("FAIN STORE — V4.5 FINAL REVIEW AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

console.log("");
console.log("V4.3 REVIEW :", v43.length);
console.log("V4.5 TARGET :", keepReview.length);

console.log("");
console.log("========================================");
console.log("18 KEEP_REVIEW — SOURCE CLASSIFICATION");
console.log("========================================");

for (const p of keepReview) {
  let category = "KEEP_REVIEW";
  let confidence = "UNKNOWN";

  const t = `${p.code} ${p.name}`.toLowerCase();

  /*
   * SPECIAL:
   * Produk pass / membership / card / fund yang
   * secara semantik bukan nominal currency.
   */
  if (
    /\bbangsawan\b/.test(t) ||
    /\bknight\b/.test(t) ||
    /\bviscount\b/.test(t) ||
    /\bperpanjang\b/.test(t) ||
    /\brenew\b/.test(t)
  ) {
    category = "SPECIAL";
    confidence = "HIGH";
  }

  /*
   * TOP-UP:
   * Produk yang jelas berupa currency / nominal recharge.
   */
  else if (
    /\bdiamond\b/.test(t) ||
    /\bdomino\b/.test(t) ||
    /\b200m\b/.test(t) ||
    /\bcoin\b/.test(t) ||
    /\bcoins\b/.test(t)
  ) {
    category = "TOP-UP";
    confidence = "HIGH";
  }

  console.log(
    `operator=${p.operatorId} | ${p.code} | ${p.name} | ${category} | confidence=${confidence}`
  );
}

console.log("");
console.log("========================================");
console.log("AMBIGUOUS — HARUS SOURCE VERIFIED");
console.log("========================================");

for (const p of keepReview) {
  const t = `${p.code} ${p.name}`.toLowerCase();

  const obvious =
    /\bbangsawan\b|\bknight\b|\bviscount\b|\bperpanjang\b|\brenew\b|\bdiamond\b|\bdomino\b|\b200m\b|\bcoin\b|\bcoins\b/.test(t);

  if (!obvious) {
    console.log(
      `operator=${p.operatorId} | ${p.code} | ${p.name}`
    );
  }
}

console.log("");
console.log("========================================");
console.log("V4.5 FINAL AUDIT SELESAI");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
