const fs = require("fs");

const overrides = JSON.parse(
  fs.readFileSync("./final-classification-overrides.json", "utf8")
);

const input = "./master-product-map.json";
const output = "./catalog-products.json";

if (!fs.existsSync(input)) {
  console.error("❌ master-product-map.json tidak ditemukan!");
  process.exit(1);
}

const master = JSON.parse(
  fs.readFileSync(input, "utf8")
);

const catalog = [];

for (const [slug, game] of Object.entries(master)) {
  if (!game || !Array.isArray(game.products)) continue;

  for (const product of game.products) {
    if (!product || !product.id || !product.name) continue;

    const override = overrides[slug] ?? null;

    // ITSUGAMARKET-style product classification
    // Normal top-up tetap NONE.
    // Produk membership/pass/card dipisahkan sebagai SPECIAL.
    const productName = String(product.name ?? "").toLowerCase();

    let autoClassification = null;
    let autoParentSlug = null;
    let autoReason = null;

    if (
      /weekly diamond pass|weekly pass|member mingguan|twilight pass|starlight member|member bulanan|monthly member|membership|bp card/.test(productName)
    ) {
      autoClassification = "SPECIAL";
      autoParentSlug =
        /weekly diamond pass|weekly pass/i.test(productName)
          ? "weekly-pass"
          : /twilight pass/i.test(productName)
            ? "twilight-pass"
            : /bp card/i.test(productName)
              ? "bp-card"
              : /member bulanan|monthly member/i.test(productName)
                ? "member-bulanan"
                : /member mingguan|weekly member/i.test(productName)
                  ? "member-mingguan"
                  : /starlight member/i.test(productName)
                    ? "starlight-member"
                    : "membership";
      autoReason = "SPECIAL product type detected from product name";
    }

    catalog.push({
      id: product.id,
      name: product.name,

      // FIELD HARGA YANG BENAR
      priceIdr: product.priceIdr ?? null,

      // CLASSIFICATION LAYER
      classification:
        override?.classification ??
        autoClassification ??
        null,
      parentSlug:
        override?.parent ??
        autoParentSlug ??
        null,
      classificationReason:
        override?.reason ??
        autoReason ??
        null,

      game: {
        id: game.gameId ?? null,
        name: game.gameName ?? "Unknown",
        slug: game.slug ?? slug
      }
    });
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  totalGames: Object.keys(master).length,
  totalProducts: catalog.length,
  products: catalog
};

fs.writeFileSync(
  output,
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log("");
console.log("========================================");
console.log("       FAIN STORE CATALOG BUILDER");
console.log("========================================");
console.log("TOTAL GAME    :", result.totalGames);
console.log("TOTAL PRODUK  :", result.totalProducts);
console.log("----------------------------------------");
console.log("FILE BERHASIL :", output);
console.log("========================================");
