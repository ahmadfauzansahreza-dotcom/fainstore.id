import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatIdr } from "@/lib/money";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { TopUpForm } from "@/components/TopUpForm";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: {
      slug,
      status: true,
      deletedAt: null,
    },
    include: {
        game: { include: { products: { where: { type: "TOPUP", status: true, deletedAt: null }, orderBy: { priceIdr: "asc" } } } },
      images: {
        orderBy: {
          position: "asc",
        },
      },
      reviews: {
        where: {
          isApproved: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
  });

  if (!product) return null;

  let availableStock = product.stockQty;

  if (product.type === "GAME_ACCOUNT") {
    availableStock = await db.gameAccount.count({
      where: {
        productId: product.id,
        status: "AVAILABLE",
      },
    });
  }

  return {
    ...product,
    availableStock,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan | FAIN STORE",
    };
  }

  return {
    title: `${product.name} | FAIN STORE`,
    description:
      product.description ??
      `Beli ${product.name} dengan proses cepat dan pembayaran aman di FAIN STORE.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const specs =
    (product.specifications as Record<string, unknown> | null) ?? {};

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce(
          (sum: number, review: any) => sum + Number(review.rating || 0),
          0
        ) / product.reviews.length
      : null;

  const imageList = product.images ?? [];
  const mainImage = imageList[0]?.url ?? "/placeholder-product.jpg";

  const isGameAccount = product.type === "GAME_ACCOUNT";
  const hasStock = product.availableStock > 0;

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <a href="/" className="transition hover:text-white">
            Home
          </a>

          <span>/</span>

          <a
            href={`/produk?game=${product.game.slug}`}
            className="transition hover:text-white"
          >
            {product.game.name}
          </a>

          <span>/</span>

          <span className="text-gray-300">
            {product.name}
          </span>
        </nav>

        {/* TOP BENEFITS */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                ⚡
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Proses Cepat
                </p>
                <p className="text-xs text-gray-500">
                  Pesanan diproses secepatnya
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                💬
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Layanan Chat
                </p>
                <p className="text-xs text-gray-500">
                  Bantuan jika mengalami kendala
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                🔒
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Pembayaran Aman
                </p>
                <p className="text-xs text-gray-500">
                  Transaksi diproses melalui sistem
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCT */}
        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">

          {/* LEFT - IMAGE */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {product.isFlashSale && (
                    <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white">
                      FLASH SALE
                    </span>
                  )}

                  {product.isBestSeller && (
                    <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-black">
                      BEST SELLER
                    </span>
                  )}

                  {product.isFeatured && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                      PILIHAN
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* THUMBNAILS */}
            {imageList.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {imageList.map((image: any, index: number) => (
                  <div
                    key={image.id}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${
                      index === 0
                        ? "border-blue-500"
                        : "border-white/10"
                    } bg-white/[0.03]`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - PURCHASE INFO */}
          <div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">

              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                {product.game.name}
              </div>

              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                {product.name}
              </h1>

              {avgRating !== null && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-amber-400">
                    ★ {avgRating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({product.reviews.length} ulasan)
                  </span>
                </div>
              )}

              {/* PRICE */}
              <div className="mt-6">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-bold text-white">
                    {formatIdr(product.priceIdr)}
                  </span>

                  {product.originalPriceIdr &&
                    product.originalPriceIdr > product.priceIdr && (
                      <span className="pb-1 text-sm text-gray-500 line-through">
                        {formatIdr(product.originalPriceIdr)}
                      </span>
                    )}
                </div>

                {product.originalPriceIdr &&
                  product.originalPriceIdr > product.priceIdr && (
                    <span className="mt-2 inline-block rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-400">
                      Harga promo
                    </span>
                  )}
              </div>

              {/* STOCK */}
              <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-400">
                    Ketersediaan
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      hasStock
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {hasStock
                      ? isGameAccount
                        ? `${product.availableStock} akun tersedia`
                        : "Tersedia"
                      : "Stok habis"}
                  </span>
                </div>
              </div>

              {/* ACCOUNT NOTICE */}
              {isGameAccount && (
                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm font-semibold text-white">
                    Informasi akun
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Detail akun akan diberikan setelah pembayaran
                    berhasil dan pesanan terverifikasi.
                  </p>
                </div>
              )}

              {/* PRODUCT SPECS */}
              {Object.keys(specs).length > 0 && (
                <div className="mt-5">
                  <h2 className="mb-3 text-sm font-semibold text-white">
                    Spesifikasi
                  </h2>

                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {Object.entries(specs).map(
                      ([key, value], index) => (
                        <div
                          key={key}
                          className={`grid grid-cols-[42%_58%] px-4 py-3 text-sm ${
                            index % 2 === 0
                              ? "bg-white/[0.02]"
                              : "bg-transparent"
                          }`}
                        >
                          <span className="text-gray-500">
                            {key}
                          </span>

                          <span className="break-words text-gray-200">
                            {String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

{product.type === "TOPUP" && product.game && (
  <TopUpForm gamesWithProducts={[{
    game: product.game.name,
    products: product.game.products
          .filter((p) => p.type === "TOPUP" && p.status)
          .sort((a, b) => a.priceIdr - b.priceIdr)
          .map((p) => ({
            id: p.id,
            name: p.name,
            priceIdr: p.priceIdr,
          }))
  }]} />
)}

              {/* ACTION */}
              <div className="mt-6">
                <AddToCartButton
                  product={{
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    quantity: 1,
                    imageUrl: mainImage,
                    priceIdr: product.priceIdr,
                    isUniqueAccount: isGameAccount,
                    maxStock: product.availableStock,
                  }}
                  disabled={!hasStock}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-gray-500">
                <span>🔒</span>
                <span>Transaksi aman melalui sistem FAIN STORE</span>
              </div>
            </div>
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">
              Deskripsi Produk
            </h2>

            {product.description ? (
              <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-400">
                {product.description}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Belum ada deskripsi produk.
              </p>
            )}

            {product.warranty && (
              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-semibold text-emerald-400">
                  Garansi
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {product.warranty}
                </p>
              </div>
            )}
          </div>

          {/* HOW TO BUY */}
          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">
              Cara Pembelian
            </h2>

            <ol className="mt-4 space-y-4">
              {[
                "Pilih produk yang ingin dibeli.",
                "Klik tombol Beli Sekarang.",
                "Periksa detail pesanan.",
                "Pilih metode pembayaran.",
                "Selesaikan pembayaran.",
                "Pesanan diproses setelah pembayaran terverifikasi.",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                    {index + 1}
                  </span>

                  <span className="text-xs leading-5 text-gray-400">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {/* REVIEWS */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Ulasan Pembeli
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Pengalaman pembeli FAIN STORE
              </p>
            </div>

            {avgRating !== null && (
              <div className="text-right">
                <div className="text-xl font-bold text-amber-400">
                  ★ {avgRating.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {product.reviews.length} ulasan
                </div>
              </div>
            )}
          </div>

          {product.reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {product.reviews.map((review: any) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white">
                      {review.user?.name ?? "Pembeli"}
                    </span>

                    <span className="text-sm text-amber-400">
                      {"★".repeat(
                        Math.max(
                          0,
                          Math.min(5, Number(review.rating || 0))
                        )
                      )}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm leading-6 text-gray-400">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-gray-500">
                Belum ada ulasan untuk produk ini.
              </p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
