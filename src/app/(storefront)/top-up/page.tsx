export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { TopUpForm } from "@/components/TopUpForm";

export const metadata = { title: "Top Up Game" };

async function getTopUpProducts() {
  const products = await db.product.findMany({
    where: { type: "TOPUP", status: true, deletedAt: null },
    include: { game: true },
    orderBy: { game: { name: "asc" } },
  });

  const byGame = new Map<string, typeof products>();
  for (const p of products) {
    const list = byGame.get(p.game.name) ?? [];
    list.push(p);
    byGame.set(p.game.name, list);
  }
  return byGame;
}

export default async function TopUpPage() {
  const byGame = await getTopUpProducts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Top Up Game</h1>
      {byGame.size === 0 ? (
        <p className="text-sm text-gray-500">Belum ada produk top up tersedia. Admin dapat menambahkannya lewat dashboard.</p>
      ) : (
        <TopUpForm gamesWithProducts={Array.from(byGame.entries()).map(([game, products]) => ({
          game,
          products: products.map((p: any) => ({ id: p.id, name: p.name, priceIdr: p.priceIdr })),
        }))} />
      )}
    </div>
  );
}
