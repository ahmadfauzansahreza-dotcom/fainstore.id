const fs = require("fs");

const REPORT = "operator-report.json";
const MASTER = "master-product-map.json";

const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));

console.log("========================================");
console.log("FAIN STORE — CLASSIFIER V4");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value) =>
  normalize(value).replace(/\s+/g, "-");

const products = [];

for (const operator of report) {
  for (const product of operator.products || []) {
    products.push({
      operatorId: Number(operator.operator_id),
      code: String(product.code ?? ""),
      name: String(product.name ?? ""),
      price: product.price,
      unit: product.unit,
      status: product.status,
    });
  }
}

/*
 * Build searchable master groups.
 *
 * IMPORTANT:
 * master-product-map.json is treated as existing classification
 * evidence, NOT something we modify.
 */
const groups = [];

for (const [key, value] of Object.entries(master)) {
  const gameName = String(
    value.gameName ??
    value.name ??
    key
  );

  const gameSlug = String(
    value.slug ??
    value.gameSlug ??
    key
  );

  const groupProducts = Array.isArray(value.products)
    ? value.products
    : [];

  groups.push({
    key,
    gameName,
    gameSlug,
    normalizedKey: normalize(key),
    normalizedGameName: normalize(gameName),
    normalizedGameSlug: normalize(gameSlug),
    products: groupProducts,
  });
}

/*
 * Explicit game aliases.
 *
 * These are deliberately conservative.
 * A strong game token beats weak generic words such as
 * "diamond", "voucher", "coins", "cash", etc.
 */
const GAME_ALIASES = [
  ["call of duty mobile", "call-of-duty-mobile"],
  ["call of duty", "call-of-duty-mobile"],
  ["codm", "call-of-duty-mobile"],

  ["free fire", "free-fire"],
  ["freefire", "free-fire"],
  ["ff ", "free-fire"],

  ["mobile legend", "mobile-legend"],
  ["mobile legends", "mobile-legend"],
  ["mlbb", "mobile-legend"],

  ["dragon raja", "dragon-raja"],
  ["genshin impact", "genshin-impact"],
  ["lords mobile", "lords-mobile"],
  ["omega legends", "omega-legends"],
  ["sausage man", "sausage-man"],
  ["super sus", "super-sus"],
  ["tom and jerry", "tom-and-jerry"],
  ["tower of fantasy", "tower-of-fantasy"],
  ["ace racer", "ace-racer"],
  ["never after", "never-after"],
  ["lifeafter", "never-after"],
  ["life after", "never-after"],
  ["mu origin", "mu-origin"],
  ["laplace m", "laplace-m"],
  ["ludo club", "ludo-club"],
  ["mangatoon", "mangatoon"],
  ["bigo live", "bigo-live"],
  ["metal slug", "metal-slug"],
  ["one punch man", "one-punch-man"],
  ["football master", "football-master"],
  ["mirage perfect skyline", "mirage-perfect-skyline"],
  ["saint seiya", "saint-seiya"],
  ["revelation", "revelation"],
  ["harry potter", "harry-potter"],
  ["be the king", "be-the-king"],
  ["hago", "hago"],
  ["google play", "google-play"],
  ["point blank", "point-blank"],
];

/*
 * Category detection follows the marketplace structure:
 *
 * Special Items
 * Top Up Instant
 * Voucher
 *
 * It is intentionally heuristic and is only an AUDIT result.
 */
function detectCategory(name) {
  const n = normalize(name);

  if (
    /\bmembership\b|\bmember\b|\bstarlight\b|\btwilight\b|\bweekly pass\b|\bweekly diamond pass\b|\bbp card\b|\bbattle pass\b|\bupgrade pass\b|\bpromotion\b|\bfestival pack\b|\bspecial\b|\bwebpay gift\b/.test(n)
  ) {
    return {
      category: "special-items",
      confidence: "HIGH",
      reason: "SPECIAL_ITEM_TOKEN",
    };
  }

  if (
    /\bvoucher\b|\bgift card\b|\bgiftcard\b|\bcode\b/.test(n)
  ) {
    return {
      category: "voucher",
      confidence: "HIGH",
      reason: "VOUCHER_TOKEN",
    };
  }

  if (
    /\bdiamond\b|\bdiamonds\b|\bcp\b|\bcredits\b|\bcoins\b|\bgold\b|\bpoints\b|\bcrystals\b|\bcandies\b|\bcoupon\b|\bcoupons\b|\btanium\b|\bjades\b|\bruby\b|\bstar credits\b|\bgolden star\b|\bstar quartz\b|\boneiric shard\b|\bgenesis crystals\b|\bnyan berry\b|\bbadges\b|\bspirals\b|\beudemons points\b|\bbanknotes\b|\bjewels\b|\btoken\b|\btokens\b/.test(n)
  ) {
    return {
      category: "top-up-instant",
      confidence: "HIGH",
      reason: "CURRENCY_TOPUP_TOKEN",
    };
  }

  return {
    category: null,
    confidence: "LOW",
    reason: "NO_CATEGORY_TOKEN",
  };
}

function aliasMatches(name) {
  const n = normalize(name);

  const matches = [];

  for (const [alias, slug] of GAME_ALIASES) {
    const a = normalize(alias);

    if (
      n === a ||
      n.includes(a)
    ) {
      matches.push({
        alias,
        slug,
      });
    }
  }

  return matches;
}

/*
 * Existing master groups can provide stronger evidence
 * than generic keyword matching.
 */
function masterMatches(name, code) {
  const n = normalize(name);
  const c = normalize(code);

  const matches = [];

  for (const group of groups) {
    let score = 0;
    const reasons = [];

    if (
      group.normalizedGameName &&
      n.includes(group.normalizedGameName)
    ) {
      score += 100;
      reasons.push("MASTER_GAME_NAME");
    }

    if (
      group.normalizedGameSlug &&
      n.includes(group.normalizedGameSlug.replace(/-/g, " "))
    ) {
      score += 90;
      reasons.push("MASTER_GAME_SLUG");
    }

    if (
      group.normalizedKey &&
      n.includes(group.normalizedKey.replace(/-/g, " "))
    ) {
      score += 80;
      reasons.push("MASTER_GROUP_KEY");
    }

    for (const p of group.products) {
      const pn = normalize(
        typeof p === "string"
          ? p
          : p.name ?? p.productName ?? p.code ?? ""
      );

      const pc = normalize(
        typeof p === "object"
          ? p.code ?? ""
          : ""
      );

      if (pc && c === pc) {
        score += 200;
        reasons.push("MASTER_PRODUCT_CODE_EXACT");
      }

      if (pn && n === pn) {
        score += 200;
        reasons.push("MASTER_PRODUCT_NAME_EXACT");
      }

      if (
        pn &&
        pn.length >= 8 &&
        (n.includes(pn) || pn.includes(n))
      ) {
        score += 40;
        reasons.push("MASTER_PRODUCT_NAME_SIMILAR");
      }
    }

    if (score > 0) {
      matches.push({
        group,
        score,
        reasons,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function classify(product) {
  const aliases = aliasMatches(product.name);
  const masters = masterMatches(product.name, product.code);
  const category = detectCategory(product.name);

  /*
   * Exact/strong master evidence.
   */
  if (masters.length > 0) {
    const best = masters[0];
    const second = masters[1];

    if (
      best.score >= 200 &&
      (!second || best.score > second.score)
    ) {
      return {
        ...product,
        gameSlug: best.group.gameSlug,
        gameName: best.group.gameName,
        category: category.category,
        confidence: "HIGH",
        reason: best.reasons.join("+"),
        masterScore: best.score,
        conflict: false,
      };
    }
  }

  /*
   * Strong explicit game-name alias.
   */
  if (aliases.length === 1) {
    const alias = aliases[0];

    return {
      ...product,
      gameSlug: alias.slug,
      gameName: alias.slug,
      category: category.category,
      confidence: "HIGH",
      reason: `EXPLICIT_GAME_ALIAS:${alias.alias}`,
      masterScore: 0,
      conflict: false,
    };
  }

  /*
   * Multiple explicit aliases = conflict.
   */
  if (aliases.length > 1) {
    return {
      ...product,
      gameSlug: null,
      gameName: null,
      category: category.category,
      confidence: "LOW",
      reason: "MULTIPLE_GAME_ALIASES",
      masterScore: 0,
      conflict: true,
    };
  }

  /*
   * Weak master evidence is not automatically accepted.
   */
  if (masters.length > 0) {
    const best = masters[0];
    const second = masters[1];

    if (
      best.score >= 80 &&
      (!second || best.score > second.score + 20)
    ) {
      return {
        ...product,
        gameSlug: best.group.gameSlug,
        gameName: best.group.gameName,
        category: category.category,
        confidence: "MEDIUM",
        reason: best.reasons.join("+"),
        masterScore: best.score,
        conflict: false,
      };
    }
  }

  /*
   * Never force unresolved products.
   */
  return {
    ...product,
    gameSlug: null,
    gameName: null,
    category: category.category,
    confidence: "UNRESOLVED",
    reason: "NO_SAFE_GAME_MATCH",
    masterScore: 0,
    conflict: false,
  };
}

const results = products.map(classify);

const summary = {
  total: results.length,
  high: results.filter(x => x.confidence === "HIGH").length,
  medium: results.filter(x => x.confidence === "MEDIUM").length,
  unresolved: results.filter(x => x.confidence === "UNRESOLVED").length,
  conflicts: results.filter(x => x.conflict).length,
  categories: {
    "top-up-instant": results.filter(x => x.category === "top-up-instant").length,
    "special-items": results.filter(x => x.category === "special-items").length,
    voucher: results.filter(x => x.category === "voucher").length,
    unresolved: results.filter(x => !x.category).length,
  },
};

console.log("\n========================================");
console.log("V4 SUMMARY");
console.log("========================================");
console.log("TOTAL PRODUCTS :", summary.total);
console.log("HIGH           :", summary.high);
console.log("MEDIUM         :", summary.medium);
console.log("UNRESOLVED     :", summary.unresolved);
console.log("CONFLICTS      :", summary.conflicts);

console.log("\nCATEGORIES");
console.log("TOP UP INSTANT :", summary.categories["top-up-instant"]);
console.log("SPECIAL ITEMS  :", summary.categories["special-items"]);
console.log("VOUCHER        :", summary.categories.voucher);
console.log("NO CATEGORY    :", summary.categories.unresolved);

console.log("\n========================================");
console.log("UNRESOLVED SAMPLE");
console.log("========================================");

for (const p of results
  .filter(x => x.confidence === "UNRESOLVED")
  .slice(0, 50)) {

  console.log(
    `operator=${p.operatorId}` +
    ` | code=${p.code}` +
    ` | name=${p.name}` +
    ` | category=${p.category ?? "NONE"}` +
    ` | reason=${p.reason}`
  );
}

console.log("\n========================================");
console.log("CONFLICT SAMPLE");
console.log("========================================");

for (const p of results
  .filter(x => x.conflict)
  .slice(0, 30)) {

  console.log(
    `operator=${p.operatorId}` +
    ` | code=${p.code}` +
    ` | name=${p.name}` +
    ` | reason=${p.reason}`
  );
}

console.log("\n========================================");
console.log("OPERATOR → GAME SUMMARY");
console.log("========================================");

const operatorMap = new Map();

for (const p of results) {
  if (!operatorMap.has(p.operatorId)) {
    operatorMap.set(p.operatorId, []);
  }

  operatorMap.get(p.operatorId).push(p);
}

for (const [operatorId, rows] of operatorMap) {
  const games = new Map();

  for (const p of rows) {
    const key = p.gameSlug ?? "UNRESOLVED";
    games.set(key, (games.get(key) || 0) + 1);
  }

  const gameSummary = [...games.entries()]
    .map(([game, count]) => `${game}:${count}`)
    .join(" | ");

  console.log(
    `operator=${operatorId} | products=${rows.length} | ${gameSummary}`
  );
}

console.log("\n========================================");
console.log("IMPORTANT CHECKS");
console.log("========================================");

const suspicious = results.filter(p =>
  /call of duty/i.test(p.name) &&
  p.gameSlug &&
  !/call-of-duty-mobile/i.test(p.gameSlug)
);

console.log(
  "COD PRODUCTS CLASSIFIED OUTSIDE COD:",
  suspicious.length
);

for (const p of suspicious.slice(0, 20)) {
  console.log(
    `  ${p.code} | ${p.name} | => ${p.gameSlug}`
  );
}

const dragon = results.filter(p =>
  /dragon raja/i.test(p.name) &&
  p.gameSlug &&
  !/dragon-raja/i.test(p.gameSlug)
);

console.log(
  "DRAGON RAJA PRODUCTS CLASSIFIED OUTSIDE DRAGON RAJA:",
  dragon.length
);

const genshin = results.filter(p =>
  /genshin impact/i.test(p.name) &&
  p.gameSlug &&
  !/genshin-impact/i.test(p.gameSlug)
);

console.log(
  "GENSHIN PRODUCTS CLASSIFIED OUTSIDE GENSHIN:",
  genshin.length
);

console.log("\n========================================");
console.log("CLASSIFIER V4 SELESAI");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");
