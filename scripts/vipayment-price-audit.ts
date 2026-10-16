import "dotenv/config";
import { vipaymentProvider } from "../lib/providers/vipayment";

async function main() {
  console.log("========================================");
  console.log("VIPAYMENT PRICE AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  const products = await vipaymentProvider.getProducts();
  const available = products.filter(
    (product) => product.status === "available"
  );

  console.log("");
  console.log("AVAILABLE SERVICES:", available.length);
  console.log("");

  const samples = available.slice(0, 30);

  console.table(
    samples.map((product) => {
      const price = product.price as unknown as Record<string, unknown>;

      return {
        code: product.code,
        game: product.game,
        name: product.name,
        basic: price?.basic,
        premium: price?.premium,
        special: price?.special,
        server: product.server,
        status: product.status,
      };
    })
  );

  const invalid = available.filter((product) => {
    const price = product.price as unknown as Record<string, unknown>;

    return !price ||
      typeof price.basic !== "number" ||
      typeof price.premium !== "number" ||
      typeof price.special !== "number";
  });

  console.log("");
  console.log("PRICE FORMAT CHECK");
  console.log("------------------");
  console.log("Valid price:", available.length - invalid.length);
  console.log("Invalid price:", invalid.length);

  if (invalid.length > 0) {
    console.log("");
    console.log("INVALID PRICE SAMPLES:");

    console.table(
      invalid.slice(0, 20).map((product) => ({
        code: product.code,
        game: product.game,
        name: product.name,
        price: product.price,
      }))
    );
  }

  console.log("");
  console.log("========================================");
  console.log("PRICE AUDIT SELESAI");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error("VIPAYMENT PRICE AUDIT FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
