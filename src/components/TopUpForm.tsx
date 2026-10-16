"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatIdr } from "@/lib/money";

interface Product {
  id: string;
  name: string;
  priceIdr: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface GameProducts {
  game: string;
  products: Product[];
}

interface TopUpFormProps {
  gamesWithProducts?: GameProducts[];
  game?: {
    name: string;
    slug: string;
    imageUrl?: string | null;
  };
  products?: Product[];
}

export function TopUpForm({
  gamesWithProducts = [],
  game,
  products: singleGameProducts = [],
}: TopUpFormProps) {
  const router = useRouter();

  const isSingleGame = Boolean(game);

  const [selectedGame, setSelectedGame] = useState(
    game?.name ?? gamesWithProducts[0]?.game ?? ""
  );

  const [selectedProductId, setSelectedProductId] = useState(
    singleGameProducts[0]?.id ??
      gamesWithProducts[0]?.products?.[0]?.id ??
      ""
  );

  const [gameUid, setGameUid] = useState("");
  const [serverId, setServerId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [promo, setPromo] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const currentGame = useMemo(
    () =>
      gamesWithProducts.find((item) => item.game === selectedGame) ??
      gamesWithProducts[0],
    [gamesWithProducts, selectedGame]
  );

  const products = isSingleGame
    ? singleGameProducts
    : currentGame?.products ?? [];

  const selectedProduct =
    products.find((item) => item.id === selectedProductId) ??
    products[0];

  const total = selectedProduct
    ? selectedProduct.priceIdr * quantity
    : 0;

  function changeGame(game: string) {
    setSelectedGame(game);

    const nextGame = gamesWithProducts.find(
      (item) => item.game === game
    );

    setSelectedProductId(nextGame?.products?.[0]?.id ?? "");
  }

  async function handleContinue() {
    if (!selectedProduct?.id || !gameUid.trim()) return;

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: email.trim() || "Customer",
          customerEmail: email.trim(),
          customerPhone: whatsapp.trim(),
          notes: "",
          couponCode: promo.trim() || undefined,
          paymentMethod,
          topUp: {
            productId: selectedProduct.id,
            gameUid: gameUid.trim(),
            serverId: serverId.trim() || undefined,
          },
          items: [
            {
              productId: selectedProduct.id,
              quantity,
              priceIdr: selectedProduct.priceIdr,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal membuat pesanan");
      }

      const paymentUrl =
        data?.paymentReference ||
        data?.payment?.checkout_url ||
        data?.payment?.payment_url;

      if (paymentUrl && /^https?:\/\//.test(paymentUrl)) {
        window.location.href = paymentUrl;
        return;
      }

      if (data?.orderId) {
        router.push(`/order/${data.orderId}`);
      }
    } catch (error) {
      console.error("Gagal membuat pesanan:", error);
    }
  }

  return (
    <div className="space-y-4">

      {/* STEP 1 */}
      <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            1
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Masukkan Data Akun
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Masukkan data akun game dengan benar.
            </p>
          </div>
        </div>

        <div className="space-y-4">

          {/* GAME */}
          {!isSingleGame && (
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">
                Pilih Game
              </label>

              <select
                value={selectedGame}
                onChange={(e) => changeGame(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#171717] px-4 text-sm text-white outline-none transition focus:border-blue-500"
              >
                {gamesWithProducts.map((game) => (
                  <option key={game.game} value={game.game}>
                    {game.game}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* UID */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Game UID
            </label>

            <input
              type="text"
              value={gameUid}
              onChange={(e) => setGameUid(e.target.value)}
              placeholder="Masukkan Game UID"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#171717] px-4 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-blue-500"
            />

            <p className="mt-2 text-[11px] text-gray-600">
              Pastikan UID yang dimasukkan sudah benar.
            </p>
          </div>

          {/* SERVER */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Server ID <span className="text-gray-600">(jika diperlukan)</span>
            </label>

            <input
              type="text"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              placeholder="Masukkan Server ID"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#171717] px-4 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-blue-500"
            />
          </div>

        </div>
      </section>

      {/* STEP 2 */}
      <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            2
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Pilih Nominal
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Pilih nominal top up yang ingin dibeli.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Array.from(
            products.reduce<
              Map<string, { name: string; products: Product[] }>
            >((groups, product) => {
              const key = product.category?.slug || "lainnya";
              const name = product.category?.name || "Lainnya";

              if (!groups.has(key)) {
                groups.set(key, { name, products: [] });
              }

              groups.get(key)!.products.push(product);
              return groups;
            }, new Map<string, { name: string; products: Product[] }>())
          ).map(([key, group]) => (
            <div key={key}>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
                {group.name}
              </h4>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {group.products.map((product) => {
                  const active = selectedProductId === product.id;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className={[
                        "relative min-h-[74px] rounded-xl border p-3 text-left transition",
                        active
                          ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                          : "border-white/10 bg-[#171717] hover:border-white/20",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold text-white">
                        {product.name}
                      </div>

                      <div className="mt-1 text-xs font-bold text-blue-400">
                        {formatIdr(product.priceIdr)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEP 3 */}
      <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            3
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Jumlah Pembelian
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Tentukan jumlah nominal yang ingin dibeli.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#171717] p-3">
          <span className="text-sm text-gray-400">
            Jumlah
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setQuantity((value) => Math.max(1, value - 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#111] text-lg text-white"
            >
              −
            </button>

            <span className="w-6 text-center text-sm font-semibold text-white">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity((value) => Math.min(10, value + 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#111] text-lg text-white"
            >
              +
            </button>
          </div>
        </div>
      </section>

      {/* STEP 4 */}
      <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            4
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Pilih Pembayaran
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Pilih metode pembayaran yang tersedia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { id: "QRIS", name: "QRIS", desc: "Bayar dengan QRIS" },
            { id: "DANA", name: "DANA", desc: "E-Wallet DANA" },
            { id: "OVO", name: "OVO", desc: "E-Wallet OVO" },
            { id: "SHOPEEPAY", name: "ShopeePay", desc: "E-Wallet ShopeePay" },
          ].map((method) => {
            const active = paymentMethod === method.id;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={[
                  "rounded-xl border p-4 text-left transition",
                  active
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                    : "border-white/10 bg-[#171717] hover:border-white/20",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-white">
                  {method.name}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {method.desc}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 5 */}
      <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            4
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Detail Pesanan
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Isi data kontak agar informasi pesanan dapat dikirim.
            </p>
          </div>
        </div>

        <div className="space-y-3">

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#171717] px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              WhatsApp
            </label>

            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#171717] px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Kode Promo
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Masukkan kode promo"
                className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#171717] px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
              />

              <button
                type="button"
                className="rounded-xl border border-white/10 bg-[#171717] px-4 text-xs font-semibold text-white"
              >
                Gunakan
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ORDER SUMMARY */}
      <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 sm:p-5">

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            Ringkasan Pesanan
          </h3>

          <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-400">
            Aman
          </span>
        </div>

        <div className="space-y-3 text-sm">

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Game
            </span>

            <span className="text-right text-white">
              {selectedGame || "-"}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Nominal
            </span>

            <span className="text-right text-white">
              {selectedProduct?.name || "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">
              Jumlah
            </span>

            <span className="text-white">
              {quantity}x
            </span>
          </div>

          <div className="my-3 border-t border-white/10" />

          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-400">
              Total
            </span>

            <span className="text-xl font-bold text-white">
              {formatIdr(total)}
            </span>
          </div>

        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedProduct?.id || !gameUid.trim()}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Pesan Sekarang!
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <span>🔒</span>
          <span>Transaksi aman melalui sistem FAIN STORE</span>
        </div>

      </section>

    </div>
  );
}
