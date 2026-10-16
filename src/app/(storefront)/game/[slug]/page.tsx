import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TopUpForm } from "@/components/TopUpForm";
import { GamePageHero } from "@/components/GamePageHero";

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;

  const game = await db.game.findUnique({
    where: {
      slug,
    },
    include: {
      categories: true,
      products: {
        where: {
          type: "TOPUP",
          status: true,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        orderBy: [
          { category: { name: "asc" } },
          { priceIdr: "asc" },
        ],
      },
    },
  });

  if (!game || !game.isActive) {
    notFound();
  }

  const products = game.products.map((product) => ({
    id: product.id,
    name: product.name,
    priceIdr: product.priceIdr,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <GamePageHero
        slug={game.slug}
        name={game.name}
        imageUrl={game.imageUrl}
      />

      {products.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-sm text-white/50">
            Produk top up untuk {game.name} belum tersedia.
          </p>
        </div>
      ) : (
        <TopUpForm
          game={{
            name: game.name,
            slug: game.slug,
            imageUrl: game.imageUrl,
          }}
          products={products}
        />
      )}
    </main>
  );
}
