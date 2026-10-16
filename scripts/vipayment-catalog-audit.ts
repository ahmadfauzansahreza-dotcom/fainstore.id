import 'dotenv/config';
import { vipaymentProvider } from "../lib/providers/vipayment";

async function main() {
  console.log("========================================");
  console.log("VIPAYMENT CATALOG AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  const products = await vipaymentProvider.getProducts();

  const games = new Map<string, number>();
  const statuses = new Map<string, number>();

  for (const product of products) {
    games.set(product.game, (games.get(product.game) || 0) + 1);

    const status = product.status || "unknown";
    statuses.set(status, (statuses.get(status) || 0) + 1);
  }

  console.log("");
  console.log("Total services:", products.length);
  console.log("Total games:", games.size);

  console.log("");
  console.log("STATUS:");
  console.table(
    [...statuses.entries()].map(([status, count]) => ({
      status,
      count,
    }))
  );

  console.log("");
  console.log("GAMES:");
  console.table(
    [...games.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([game, count]) => ({
        game,
        products: count,
      }))
  );

  console.log("");
  console.log("SAMPLE PRODUCTS:");
  console.table(
    products.slice(0, 20).map((product) => ({
      code: product.code,
      game: product.game,
      name: product.name,
      price:
        product.price?.special ??
        product.price?.premium ??
        product.price?.basic ??
        null,
      server: product.server,
      status: product.status,
    }))
  );

  console.log("");
  console.log("========================================");
  console.log("AUDIT SELESAI — DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("VIPAYMENT AUDIT FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
