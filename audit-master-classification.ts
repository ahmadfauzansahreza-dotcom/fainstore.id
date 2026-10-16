const master = require("./master-product-map.json");

const SPECIAL = new Set([
  "weekly",
  "monthly",
  "pass",
  "card",
  "member",
  "membership",
  "premium",
  "promotion",
  "daily",
  "special",
  "selection",
  "growth",
  "upgrade",
  "gift",
  "supplies",
  "inquiry",
  "investment",
  "collector",
  "blessing",
  "webpay",
  "coupon",
  "coupons",
  "bp"
]);

const VARIANT = new Set([
  "unipin",
  "gamepoint",
  "dgh",
  "dgr",
  "kcid",
  "rzid",
  "kiosgamer",
  "up",
  "gp",
  "my",
  "ph",
  "br",
  "id",
  "sea"
]);

function classify(slug: string) {
  const parts = slug.toLowerCase().split("-");

  const special = parts.filter(x => SPECIAL.has(x));
  const variant = parts.filter(x => VARIANT.has(x));

  let type = "CANONICAL";

  if (special.length && variant.length) {
    type = "SPECIAL_VARIANT";
  } else if (special.length) {
    type = "SPECIAL";
  } else if (variant.length) {
    type = "VARIANT";
  }

  const parent = parts
    .filter(x => !SPECIAL.has(x) && !VARIANT.has(x))
    .join("-");

  if (!parent) {
    type = "REVIEW";
  }

  return {
    slug,
    name: master[slug]?.gameName ?? "-",
    products: master[slug]?.totalProducts ?? 0,
    type,
    parent: parent || null,
    special,
    variant
  };
}

const result = Object.keys(master)
  .sort()
  .map(classify);

const counts: Record<string, number> = {};
for (const x of result) {
  counts[x.type] = (counts[x.type] || 0) + 1;
}

console.log("===== MASTER CLASSIFICATION AUDIT =====");
console.log(`TOTAL MASTER : ${result.length}`);
console.log("");

console.log("CLASSIFICATION:");
for (const [k, v] of Object.entries(counts)) {
  console.log(`${k.padEnd(18)}: ${v}`);
}

const review = result.filter(x => x.type === "REVIEW");

console.log("");
console.log(`REVIEW : ${review.length}`);

if (review.length) {
  console.log("\n===== REVIEW =====");

  for (const x of review) {
    console.log(
      `${x.slug} | ${x.name} | products=${x.products}`
    );
  }
}

const multi = result.filter(x =>
  x.parent &&
  (x.type === "VARIANT" ||
   x.type === "SPECIAL" ||
   x.type === "SPECIAL_VARIANT")
);

console.log("");
console.log(`CLASSIFIED VARIANTS/SPECIAL : ${multi.length}`);

console.log("\n===== END =====");
console.log("DATABASE TIDAK DIUBAH.");
console.log("MASTER-PRODUCT-MAP TIDAK DIUBAH.");
