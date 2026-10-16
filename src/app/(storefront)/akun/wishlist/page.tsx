import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCardWithWishlist } from "@/components/product/ProductCardWithWishlist";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const wishlist = await db.wishlist.findMany({
    where: { userId },
    include: { product: { include: { images: { take: 1 }, game: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Wishlist Saya</h1>

      {wishlist.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada produk di wishlist Anda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {wishlist.map((w: any) => (
            <ProductCardWithWishlist
              key={w.id}
              productId={w.product.id}
              slug={w.product.slug}
              name={w.product.name}
              imageUrl={w.product.images[0]?.url ?? "/placeholder-product.jpg"}
              gameName={w.product.game.name}
              priceIdr={w.product.priceIdr}
              originalPriceIdr={w.product.originalPriceIdr}
              discountPct={w.product.discountPct}
              inStock={w.product.type === "GAME_ACCOUNT" || w.product.stockQty > 0}
              soldCount={w.product.soldCount}
              isFavorited
            />
          ))}
        </div>
      )}
    </div>
  );
}
