const fs = require("fs");

const report = JSON.parse(
  fs.readFileSync("operator-report.json", "utf8")
);

const master = JSON.parse(
  fs.readFileSync("master-product-map.json", "utf8")
);

const normalize = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const products = [];

for (const op of report) {
  for (const p of op.products || []) {
    products.push({
      operatorId: Number(op.operator_id),
      code: String(p.code ?? ""),
      name: String(p.name ?? ""),
      price: p.price,
      unit: p.unit,
      status: p.status,
    });
  }
}

const groups = Object.entries(master).map(([key, value]) => ({
  key,
  gameId: value.gameId ?? null,
  gameName: value.gameName ?? value.name ?? key,
  slug: value.slug ?? value.gameSlug ?? key,
  products: Array.isArray(value.products) ? value.products : [],
}));

/*
 * Strong game tokens.
 * Generic currency words are deliberately excluded.
 */
const GAME_RULES = [
  [/call\s+of\s+duty(?:\s+mobile)?|\bcodm\b/i, "call-of-duty-mobile"],
  [/free\s*fire|\bff\d+/i, "free-fire"],
  [/mobile\s+legend|\bmlbb\b/i, "mobile-legend"],
  [/dragon\s+raja/i, "dragon-raja"],
  [/genshin\s+impact/i, "genshin-impact"],
  [/lords\s+mobile/i, "lords-mobile"],
  [/omega\s+legends/i, "omega-legends"],
  [/sausage\s+man/i, "sausage-man"],
  [/super\s+sus/i, "super-sus"],
  [/tom\s+and\s+jerry/i, "tom-and-jerry"],
  [/tower\s+of\s+fantasy/i, "tower-of-fantasy"],
  [/ace\s+racer/i, "ace-racer"],
  [/never\s+after|life\s*after/i, "never-after"],
  [/mu\s+origin/i, "mu-origin"],
  [/laplace\s+m/i, "laplace-m"],
  [/ludo\s+club/i, "ludo-club"],
  [/mangatoon/i, "mangatoon"],
  [/bigo\s+live|mango\s+live/i, "bigo-live"],
  [/metal\s+slug/i, "metal-slug"],
  [/one\s+punch\s+man/i, "one-punch-man"],
  [/football\s+master/i, "football-master"],
  [/mirage.*perfect\s+skyline/i, "mirage-perfect-skyline"],
  [/saint\s+seiya/i, "saint-seiya"],
  [/revelation/i, "revelation"],
  [/harry\s+potter/i, "harry-potter"],
  [/be\s+the\s+king/i, "be-the-king"],
  [/hago/i, "hago"],
  [/google\s+play/i, "google-play"],
  [/point\s+blank/i, "point-blank"],
  [/idle\s+legend/i, "idle-legend"],
  [/goddess\s+of\s+victory|\bnikke\b/i, "goddess-of-victory-nikke"],
  [/naruto.*slugfest/i, "metal-slug"],
];

/*
 * Special-item terminology based on the marketplace structure.
 */
const SPECIAL_RULES = [
  /\bmembership\b/i,
  /\bmember\b/i,
  /\bstarlight\b/i,
  /\btwilight\s+pass\b/i,
  /\bweekly\s+pass\b/i,
  /\bweekly\s+diamond\s+pass\b/i,
  /\bbp\s+card\b/i,
  /\bbattle\s+pass\b/i,
  /\bupgrade\s+pass\b/i,
  /\bupgrade\s+awards\b/i,
  /\bfestival\s+pack\b/i,
  /\bwebpay\s+gift\b/i,
  /\bnewbie\b/i,
  /\bspecial\b/i,
];

const VOUCHER_RULES = [
  /\bvoucher\b/i,
  /\bgift\s*card\b/i,
  /\bgiftcard\b/i,
];

const TOPUP_RULES = [
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
  /\bnyan\s+berry\b/i,
  /\boneiric\s+shard\b/i,
  /\bgenesis\s+crystals\b/i,
  /\bstar\s+credits\b/i,
  /\bgolden\s+star\b/i,
  /\bstar\s+quartz\b/i,
  /\beudemons\s+points\b/i,
];

function categoryAudit(name) {
  const hits = [];

  for (const r of SPECIAL_RULES) {
    if (r.test(name)) hits.push("SPECIAL");
  }

  for (const r of VOUCHER_RULES) {
    if (r.test(name)) hits.push("VOUCHER");
  }

  for (const r of TOPUP_RULES) {
    if (r.test(name)) hits.push("TOPUP");
  }

  const unique = [...new Set(hits)];

  if (unique.length === 0) {
    return {
      category: null,
      categoryConfidence: "NONE",
      categoryEvidence: [],
    };
  }

  if (unique.length > 1) {
    return {
      category: null,
      categoryConfidence: "CONFLICT",
      categoryEvidence: unique,
    };
  }

  return {
    category:
      unique[0] === "SPECIAL"
        ? "special-items"
        : unique[0] === "VOUCHER"
          ? "voucher"
          : "top-up-instant",
    categoryConfidence: "HIGH",
    categoryEvidence: unique,
  };
}

function explicitGameAudit(name) {
  const matches = [];

  for (const [regex, slug] of GAME_RULES) {
    if (regex.test(name)) {
      matches.push(slug);
    }
  }

  return [...new Set(matches)];
}

/*
 * IMPORTANT:
 * Master groups are only evidence.
 * They do NOT automatically create HIGH confidence.
 */
function masterEvidence(product) {
  const n = normalize(product.name);
  const c = normalize(product.code);

  const candidates = [];

  for (const group of groups) {
    let score = 0;
    const evidence = [];

    const groupName = normalize(group.gameName);
    const groupSlug = normalize(group.slug).replace(/-/g, " ");
    const key = normalize(group.key).replace(/-/g, " ");

    if (groupName && n === groupName) {
      score += 100;
      evidence.push("EXACT_GROUP_NAME");
    }

    if (groupName && n.includes(groupName)) {
      score += 40;
      evidence.push("GROUP_NAME_CONTAINS");
    }

    if (groupSlug && n.includes(groupSlug)) {
      score += 30;
      evidence.push("GROUP_SLUG_CONTAINS");
    }

    if (key && n.includes(key)) {
      score += 25;
      evidence.push("GROUP_KEY_CONTAINS");
    }

    for (const p of group.products) {
      if (typeof p === "string") {
        const pn = normalize(p);

        if (pn && n === pn) {
          score += 120;
          evidence.push("EXACT_MASTER_PRODUCT");
        }
      } else if (p && typeof p === "object") {
        const pn = normalize(
          p.name ?? p.productName ?? ""
        );

        const pc = normalize(
          p.code ?? ""
        );

        if (pc && c === pc) {
          score += 150;
          evidence.push("EXACT_MASTER_CODE");
        }

        if (pn && n === pn) {
          score += 120;
          evidence.push("EXACT_MASTER_PRODUCT");
        }
      }
    }

    if (score > 0) {
      candidates.push({
        slug: group.slug,
        gameName: group.gameName,
        score,
        evidence: [...new Set(evidence)],
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates;
}

function audit(product) {
  const games = explicitGameAudit(product.name);
  const masterCandidates = masterEvidence(product);
  const category = categoryAudit(product.name);

  const masterBest = masterCandidates[0] ?? null;
  const masterSecond = masterCandidates[1] ?? null;

  let game = null;
  let confidence = "UNRESOLVED";
  let reason = "NO_SAFE_GAME_EVIDENCE";

  /*
   * Explicit product-name game evidence has highest priority.
   */
  if (games.length === 1) {
    game = games[0];
    confidence = "HIGH";
    reason = "EXPLICIT_GAME_NAME";
  } else if (games.length > 1) {
    confidence = "CONFLICT";
    reason = "MULTIPLE_EXPLICIT_GAME_MATCHES";
  } else if (
    masterBest &&
    masterBest.score >= 150 &&
    (!masterSecond ||
      masterBest.score >= masterSecond.score + 50)
  ) {
    game = masterBest.slug;
    confidence = "HIGH";
    reason = masterBest.evidence.join("+");
  } else if (
    masterBest &&
    masterBest.score >= 80 &&
    (!masterSecond ||
      masterBest.score >= masterSecond.score + 30)
  ) {
    game = masterBest.slug;
    confidence = "MEDIUM";
    reason = masterBest.evidence.join("+");
  } else if (masterBest) {
    game = null;
    confidence = "REVIEW";
    reason = "WEAK_MASTER_EVIDENCE";
  }

  return {
    ...product,
    game,
    confidence,
    reason,
    explicitGames: games,
    masterBest,
    masterSecond,
    category: category.category,
    categoryConfidence: category.categoryConfidence,
    categoryEvidence: category.categoryEvidence,
  };
}

const results = products.map(audit);

const count = (fn) => results.filter(fn).length;

console.log("========================================");
console.log("V4.1 CONFIDENCE AUDIT");
console.log("========================================");
console.log("TOTAL PRODUCTS :", results.length);
console.log("");
console.log("HIGH           :", count(x => x.confidence === "HIGH"));
console.log("MEDIUM         :", count(x => x.confidence === "MEDIUM"));
console.log("REVIEW         :", count(x => x.confidence === "REVIEW"));
console.log("UNRESOLVED     :", count(x => x.confidence === "UNRESOLVED"));
console.log("CONFLICT       :", count(x => x.confidence === "CONFLICT"));

console.log("");
console.log("CATEGORY");
console.log(
  "TOP UP         :",
  count(x => x.category === "top-up-instant")
);
console.log(
  "SPECIAL        :",
  count(x => x.category === "special-items")
);
console.log(
  "VOUCHER        :",
  count(x => x.category === "voucher")
);
console.log(
  "NO CATEGORY    :",
  count(x => !x.category)
);
console.log(
  "CATEGORY CONFLICT:",
  count(x => x.categoryConfidence === "CONFLICT")
);

function printSection(title, filter, limit = 50) {
  console.log("\n========================================");
  console.log(title);
  console.log("========================================");

  const rows = results.filter(filter);

  console.log("COUNT:", rows.length);

  for (const p of rows.slice(0, limit)) {
    console.log(
      [
        `operator=${p.operatorId}`,
        `code=${p.code}`,
        `name=${p.name}`,
        `game=${p.game ?? "NONE"}`,
        `confidence=${p.confidence}`,
        `reason=${p.reason}`,
        `category=${p.category ?? "NONE"}`,
        `categoryEvidence=${p.categoryEvidence.join(",") || "NONE"}`,
        `master=${p.masterBest?.slug ?? "NONE"}`,
        `masterScore=${p.masterBest?.score ?? 0}`,
        `second=${p.masterSecond?.slug ?? "NONE"}`,
      ].join(" | ")
    );
  }
}

printSection(
  "REVIEW SAMPLE",
  x => x.confidence === "REVIEW"
);

printSection(
  "UNRESOLVED SAMPLE",
  x => x.confidence === "UNRESOLVED"
);

printSection(
  "CONFLICT SAMPLE",
  x => x.confidence === "CONFLICT"
);

printSection(
  "HIGH PRODUCTS WITH ONLY MASTER EVIDENCE",
  x =>
    x.confidence === "HIGH" &&
    x.explicitGames.length === 0
);

printSection(
  "CATEGORY CONFLICT SAMPLE",
  x => x.categoryConfidence === "CONFLICT"
);

printSection(
  "AOV / PB / TOKOVOUCHER SAMPLE",
  x =>
    /aov|point\s*blank|pb\s*cash|tokovoucher/i.test(x.name)
);

printSection(
  "CODM SAMPLE",
  x =>
    /call\s+of\s+duty|codm|\bcp\b/i.test(x.name)
);

printSection(
  "DRAGON RAJA SAMPLE",
  x =>
    /dragon\s+raja/i.test(x.name)
);

printSection(
  "GENSHIN SAMPLE",
  x =>
    /genshin\s+impact/i.test(x.name)
);

printSection(
  "LORDS MOBILE SAMPLE",
  x =>
    /lords\s+mobile/i.test(x.name)
);

console.log("\n========================================");
console.log("V4.1 AUDIT COMPLETE");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");
