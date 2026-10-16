import fs from "fs";

type ProductSource = {
  kode_produk: string;
  nama: string;
  operator_id: number;
};

type OperatorMap = {
  operator_id: number;
  detected_games?: string[];
};

type MasterEntry = {
  gameName?: string;
  totalProducts?: number;
  products?: Array<{
    kode_produk?: string;
    name?: string;
  }>;
};

const data: ProductSource[] = JSON.parse(
  fs.readFileSync("data-produk-10-08-26.json", "utf8")
);

const operatorMapping: OperatorMap[] = JSON.parse(
  fs.readFileSync("operator-mapping.json", "utf8")
);

const master: Record<string, MasterEntry> = JSON.parse(
  fs.readFileSync("master-product-map.json", "utf8")
);

const productOperator = new Map<string, number>();

for (const p of data) {
  productOperator.set(String(p.kode_produk), p.operator_id);
}

const operatorGames = new Map<number, string[]>();

for (const o of operatorMapping) {
  operatorGames.set(
    Number(o.operator_id),
    (o.detected_games ?? []).filter((g) => g !== "NEEDS_REVIEW")
  );
}

const SPECIAL = new Set([
  "weekly-pass-kcid",
  "weekly-pass-unipin-br",
  "bp-card",
]);

const PROVIDER_ONLY = new Set([
  "dgh",
  "dgr",
  "unipin",
]);

function normalizeDetected(game: string): string {
  const map: Record<string, string> = {
    FREE_FIRE: "free-fire",
    MOBILE_LEGENDS: "mobile-legend",
    CALL_OF_DUTY: "call-of-duty-mobile",
    GENSHIN_IMPACT: "genshin-impact",
    POINT_BLANK: "point-blank",
    HONKAI_STAR_RAIL: "honkai-star-rail",
    RAGNAROK: "ragnarok",
    LORDS_MOBILE: "lords-mobile",
    DRAGON_RAJA: "dragon-raja",
    SAUSAGE_MAN: "sausage-man",
    TOM_AND_JERRY: "tom-and-jerry",
    ACE_RACER: "ace-racer",
    NARUTO: "naruto-slugfest-x",
    ONE_PUNCH_MAN: "one-punch-man",
    OMEGA_LEGENDS: "omega-legends",
    LAPLACE_M: "laplace-m",
    FOOTBALL_MASTER: "football-master",
    SAINT_SEIYA: "saint-seiya",
    MANGO_LIVE: "mango-live",
    BIGOLIVE: "bigo-live",
    PROJECT_INTR0PY: "project-entropy",
    VALORANT: "valorant",
    HARRY_POTTER: "harry-potter",
    METAL_SLUG: "metal-slug-awakening",
    GOOGLE_PLAY: "google-play",
    GARENA: "garena-shell",
    AOV: "aov",
  };

  return map[game] ?? game.toLowerCase().replace(/_/g, "-");
}

const report: Array<{
  slug: string;
  name: string;
  products: number;
  operators: number[];
  detected: string[];
  parent: string | null;
  status: string;
}> = [];

for (const [slug, entry] of Object.entries(master)) {
  const products = entry.products ?? [];

  const operatorIds = [
    ...new Set(
      products
        .map((p) => productOperator.get(String(p.kode_produk)))
        .filter((x): x is number => typeof x === "number")
    ),
  ];

  const detected = [
    ...new Set(
      operatorIds.flatMap((id) => operatorGames.get(id) ?? [])
    ),
  ];

  let parent: string | null = null;
  let status = "REVIEW";

  if (SPECIAL.has(slug)) {
    parent = "mobile-legend";
    status = "SPECIAL → MOBILE_LEGEND";
  } else if (PROVIDER_ONLY.has(slug)) {
    parent = null;
    status = "PROVIDER_ONLY";
  } else if (detected.length === 1) {
    parent = normalizeDetected(detected[0]);
    status = "HIGH";
  } else if (detected.length > 1) {
    status = "MULTI_DETECTED";
  }

  report.push({
    slug,
    name: entry.gameName ?? "-",
    products: entry.totalProducts ?? products.length,
    operators: operatorIds,
    detected,
    parent,
    status,
  });
}

const counts: Record<string, number> = {};

for (const r of report) {
  counts[r.status] = (counts[r.status] ?? 0) + 1;
}

console.log("===== FINAL HIERARCHY AUDIT =====");
console.log(`MASTER GAMES : ${report.length}`);
console.log("");

for (const [k, v] of Object.entries(counts)) {
  console.log(`${k.padEnd(22)}: ${v}`);
}

console.log("\n===== NEEDS ATTENTION =====");

for (const r of report.filter(
  (x) =>
    x.status === "REVIEW" ||
    x.status === "MULTI_DETECTED" ||
    x.status === "PROVIDER_ONLY"
)) {
  console.log(
    `${r.slug} | ${r.name} | products=${r.products} | ` +
    `operators=${r.operators.join(",")} | ` +
    `detected=${r.detected.join(",") || "-"} | ` +
    `status=${r.status}`
  );
}

const totalProducts = report.reduce((s, x) => s + x.products, 0);

console.log("\n===== COVERAGE =====");
console.log(`MASTER PRODUCTS SUM : ${totalProducts}`);
console.log(`SOURCE PRODUCTS     : ${data.length}`);

console.log("\nDATABASE TIDAK DIUBAH.");
