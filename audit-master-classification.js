const x = require("./master-product-map.json");

const entries = Object.entries(x);

const providerWords = [
  "unipin",
  "gamepoint",
  "dgh",
  "dgr",
  "kiosgamer",
  "kcid",
  "up",
  "gp"
];

const regionWords = [
  "my",
  "ph",
  "br",
  "id",
  "global",
  "sea",
  "asia",
  "europe",
  "us"
];

const specialWords = [
  "weekly",
  "monthly",
  "pass",
  "card",
  "membership",
  "member",
  "promotion",
  "premium",
  "daily",
  "special",
  "selection",
  "growth",
  "upgrade",
  "adventure",
  "gift",
  "supplies",
  "inquiry",
  "investment",
  "collector",
  "blessing",
  "star",
  "twilight"
];

function classify(slug, name) {
  const s = `${slug} ${name}`.toLowerCase();

  const hasProvider = providerWords.some(w =>
    new RegExp(`(^|-)${w}($|-)`).test(slug)
  );

  const hasRegion = regionWords.some(w =>
    new RegExp(`(^|-)${w}($|-)`).test(slug)
  );

  const hasSpecial = specialWords.some(w =>
    s.includes(w)
  );

  if (hasSpecial) return "SPECIAL_PRODUCT";
  if (hasProvider || hasRegion) return "VARIANT";
  return "CANONICAL";
}

const result = {
  CANONICAL: [],
  VARIANT: [],
  SPECIAL_PRODUCT: [],
  UNKNOWN: []
};

for (const [slug, v] of entries) {
  const name = v.gameName || "";
  const type = classify(slug, name);

  result[type].push({
    slug,
    name,
    products: v.totalProducts ?? v.products?.length ?? 0
  });
}

console.log("===== MASTER CLASSIFICATION AUDIT =====");
console.log(`TOTAL MASTER : ${entries.length}`);
console.log("");

for (const type of Object.keys(result)) {
  console.log(`${type.padEnd(17)}: ${result[type].length}`);
}

console.log("\n===== CANONICAL =====");
for (const v of result.CANONICAL) {
  console.log(`${v.slug} | ${v.name} | products=${v.products}`);
}

console.log("\n===== VARIANT =====");
for (const v of result.VARIANT) {
  console.log(`${v.slug} | ${v.name} | products=${v.products}`);
}

console.log("\n===== SPECIAL PRODUCT =====");
for (const v of result.SPECIAL_PRODUCT) {
  console.log(`${v.slug} | ${v.name} | products=${v.products}`);
}

console.log("\n===== END =====");
