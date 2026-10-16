const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const game = await db.game.findUnique({
    where: {
      slug: "mobile-legend"
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  console.log("GAME DITEMUKAN:");
  console.log(game);

  if (!game) {
    console.log("GAME MOBILE LEGEND TIDAK DITEMUKAN");
    return;
  }

  const data = require("./data-produk-10-08-26.json");
  const kode = ["ML55", "ML165", "ML275", "ML565"];

  for (const x of data.filter(x => kode.includes(x.kode_produk))) {
    try {
      await db.product.create({
        data: {
          name: x.nama,
          slug: x.kode_produk.toLowerCase() + "-" + String(x.operator_id),
          type: "TOPUP",
          gameId: game.id,
          priceIdr: Number(x.harga_rupiah || 0),
          stockQty: 0,
          status: true
        }
      });

      console.log("BERHASIL:", x.kode_produk, x.nama);
    } catch (e) {
      console.log("GAGAL:", x.kode_produk);
      console.log(e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
