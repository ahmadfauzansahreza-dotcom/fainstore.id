import "dotenv/config";
import { vipaymentProvider } from "../lib/providers/vipayment";

async function main() {
  console.log("========================================");
  console.log("VIPAYMENT NORMALIZATION AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  const products = await vipaymentProvider.getProducts();

  const available = products.filter(
    (product) => product.status === "available"
  );

  const games = new Map<string, number>();

  for (const product of available) {
    games.set(
      product.game,
      (games.get(product.game) ?? 0) + 1
    );
  }

  console.log("");
  console.log("AVAILABLE PRODUCTS:", available.length);
  console.log("ACTIVE GAMES:", games.size);
  console.log("");

  console.log("GAME PRODUCT COUNTS:");
  console.table(
    [...games.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([game, products]) => ({
        game,
        products,
      }))
  );

  console.log("");
  console.log("NORMALIZATION SAMPLE:");
  console.log("");

  console.table(
    available.slice(0, 30).map((product) => {
      const price = product.price as unknown as {
        basic: number;
        premium: number;
        special: number;
      };

      return {
        provider: "vipayment",
        code: product.code,
        game: product.game,
        name: product.name,
        server: product.server ?? "",
        basic: price.basic,
        premium: price.premium,
        special: price.special,
        provider_price: price.special,
        status: product.status,
      };
    })
  );

  console.log("");
  console.log("CHECK:");
  console.log("------------------");

  const duplicateCodes = new Set<string>();
  const seenCodes = new Set<string>();

  for (const product of available) {
    if (seenCodes.has(product.code)) {
      duplicateCodes.add(product.code);
    }

    seenCodes.add(product.code);
  }

  const invalidSpecial = available.filter((product) => {
    const price = product.price as unknown as {
      special: unknown;
    };

    return typeof price.special !== "number" || price.special <= 0;
  });

  console.log("Duplicate codes:", duplicateCodes.size);
  console.log("Invalid special price:", invalidSpecial.length);

  console.log("");
  console.log("========================================");
  console.log("NORMALIZATION AUDIT SELESAI");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("NORMALIZATION AUDIT FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
