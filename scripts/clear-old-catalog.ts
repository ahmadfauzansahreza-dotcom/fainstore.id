import { db } from "../src/lib/db";

async function main() {
  console.log("========================================");
  console.log("FAIN STORE — CLEAR OLD CATALOG");
  console.log("========================================");

  await db.$transaction(async (tx) => {
    await tx.gameAccount.deleteMany({});
    await tx.productImage.deleteMany({});
    await tx.wishlist.deleteMany({});
    await tx.review.deleteMany({});
    await tx.product.deleteMany({});
    await tx.category.deleteMany({});
    await tx.game.deleteMany({});
  });

  const [games, categories, products, images] = await Promise.all([
    db.game.count(),
    db.category.count(),
    db.product.count(),
    db.productImage.count(),
  ]);

  console.log("");
  console.log("CATALOG CLEARED");
  console.log(`Games         : ${games}`);
  console.log(`Categories    : ${categories}`);
  console.log(`Products      : ${products}`);
  console.log(`ProductImages : ${images}`);
  console.log("");
  console.log("Order / OrderItem / Payment TIDAK DIHAPUS.");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("CLEAR CATALOG FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
