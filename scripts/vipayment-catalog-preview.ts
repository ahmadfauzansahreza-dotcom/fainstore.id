import "dotenv/config";
import { vipaymentProvider } from "../lib/providers/vipayment";

async function main() {
  console.log("========================================");
  console.log("VIPAYMENT CATALOG PREVIEW");
  console.log("DRY RUN — NO DATABASE CHANGES");
  console.log("========================================");

  const all = await vipaymentProvider.getProducts();

  const available = all.filter(
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
  console.log("TOTAL SERVICES :", all.length);
  console.log("AVAILABLE      :", available.length);
  console.log("EMPTY          :", all.length - available.length);
  console.log("GAMES ACTIVE   :", games.size);

  console.log("");
  console.log("ACTIVE GAMES:");
  console.table(
    [...games.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([game, products]) => ({
        game,
        products,
      }))
  );

  console.log("");
  console.log("SAMPLE NORMALIZED PRODUCTS:");
  console.table(
    available.slice(0, 30).map((product) => ({
      provider: "vipayment",
      code: product.code,
      game: product.game,
      name: product.name,
      server: product.server,
      price: product.price,
      status: product.status,
    }))
  );

  console.log("");
  console.log("========================================");
  console.log("PREVIEW SELESAI");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("VIPAYMENT PREVIEW FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
