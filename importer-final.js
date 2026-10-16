const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const data = require("./data-produk-10-08-26.json");

// MAPPING YANG SUDAH KITA VERIFIKASI
const GAME_MAP = {
  29: "cmsq9obe9004is61wvj17wc5p", // Mobile Legend
  124: "cmsq9uk8320hgs61whk1wnj21", // Call of Duty DGR
};

async function main() {
  console.log("========================================");
  console.log("     FAIN STORE - IMPORTER FINAL");
  console.log("========================================");
  console.log("TOTAL DATA JSON :", data.length);
  console.log("");

  let berhasil = 0;
  let dilewati = 0;
  let gagal = 0;

  const statistik = {};

  for (const x of data) {
    const operatorId = Number(x.operator_id);
    const gameId = GAME_MAP[operatorId];

    // Operator belum punya mapping game
    if (!gameId) {
      dilewati++;

      statistik[operatorId] =
        (statistik[operatorId] || 0) + 1;

      continue;
    }

    try {
      const nama = String(x.nama || "").trim();

      if (!nama) {
        gagal++;
        console.log("GAGAL: nama produk kosong");
        continue;
      }

      const slug =
        `${nama}-${x.kode_produk}-${operatorId}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const harga = Number(x.harga_rupiah || 0);

      // Cek apakah produk dengan kombinasi game + kode sudah ada
      const existing = await db.product.findFirst({
        where: {
          gameId: gameId,
          name: nama,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        dilewati++;
        continue;
      }

      await db.product.create({
        data: {
          name: nama,
          slug: slug,
          type: "TOPUP",
          gameId: gameId,
          priceIdr: harga,
          stockQty: 0,
          status: true,
        },
      });

      berhasil++;

      console.log(
        "BERHASIL | OP:",
        operatorId,
        "|",
        x.kode_produk,
        "|",
        nama,
        "| Rp",
        harga
      );

    } catch (e) {
      gagal++;

      console.log(
        "GAGAL | OP:",
        operatorId,
        "|",
        x.kode_produk,
        "|",
        e.message
      );
    }
  }

  console.log("");
  console.log("========================================");
  console.log("             HASIL IMPORT");
  console.log("========================================");
  console.log("TOTAL JSON  :", data.length);
  console.log("BERHASIL    :", berhasil);
  console.log("DILEWATI    :", dilewati);
  console.log("GAGAL       :", gagal);
  console.log("");

  console.log("========================================");
  console.log("OPERATOR BELUM DIMAPPING");
  console.log("========================================");

  for (const [operator, jumlah] of Object.entries(statistik)) {
    console.log(
      "OPERATOR",
      operator,
      "->",
      jumlah,
      "produk"
    );
  }

  console.log("");
  console.log("IMPORT SELESAI.");
}

main()
  .catch((e) => {
    console.error("ERROR FATAL:");
    console.error(e);
  })
  .finally(() => db.$disconnect());
