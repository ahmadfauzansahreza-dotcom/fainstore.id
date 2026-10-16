require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getOrCreateGame(name) {
  const safeName = name || "Other";
  const slug = makeSlug(safeName) || "other";

  // 1. Cari berdasarkan nama.
  const byName = await prisma.game.findUnique({
    where: { name: safeName },
  });

  if (byName) {
    return byName;
  }

  // 2. Kalau nama tidak ada, cari berdasarkan slug.
  //    Ini menangani kasus seperti:
  //    "Metal Slug Awakening 3200 Ruby"
  //    "Metal Slug Awakening 6500 Ruby"
  //    yang sama-sama menghasilkan slug game yang sama.
  const bySlug = await prisma.game.findUnique({
    where: { slug },
  });

  if (bySlug) {
    return bySlug;
  }

  // 3. Kalau benar-benar belum ada, buat game baru.
  return prisma.game.create({
    data: {
      name: safeName,
      slug,
    },
  });
}

async function main() {
  const data = JSON.parse(
    fs.readFileSync("./data-produk-10-08-26.json", "utf8")
  );

  console.log("================================");
  console.log("TOTAL DATA JSON:", data.length);
  console.log("================================");

  let berhasil = 0;
  let gagal = 0;
  let dibuat = 0;
  let dilewati = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      const gameName = String(item.nama || "")
        .replace(/\d[\d.,+() ]*/g, "")
        .replace(
          /\b(Diamond|Diamonds|Voucher|CP|UC|Gold|Coins|Coin|Tokens|Token|Credits|Credit|Ruby|Jade|Jades|Coupons|Coupon|Badges|Badge|Spirals|Candies|Banknotes|FMP|PB Cash|RC)\b/gi,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();

      const safeGameName = gameName || "Other";

      const game = await getOrCreateGame(safeGameName);

      const baseSlug =
        makeSlug(item.kode_produk || "produk") +
        "-" +
        String(item.operator_id || "0") +
        "-" +
        String(i + 1);

      const existingProduct = await prisma.product.findUnique({
        where: {
          slug: baseSlug,
        },
        select: {
          id: true,
        },
      });

      await prisma.product.upsert({
        where: {
          slug: baseSlug,
        },
        update: {
          name: String(item.nama || "Produk"),
          gameId: game.id,
          priceIdr: Number(item.harga_rupiah || 0),
          status: true,
        },
        create: {
          name: String(item.nama || "Produk"),
          slug: baseSlug,
          type: "TOPUP",
          gameId: game.id,
          priceIdr: Number(item.harga_rupiah || 0),
          stockQty: 0,
          status: true,
        },
      });

      if (existingProduct) {
        dilewati++;
      } else {
        dibuat++;
      }

      berhasil++;

      if (berhasil % 50 === 0) {
        console.log(
          `Progress: ${berhasil}/${data.length} | Baru: ${dibuat} | Sudah ada: ${dilewati}`
        );
      }
    } catch (error) {
      gagal++;

      console.log(
        `GAGAL produk #${i + 1}: ${item.nama || "Tanpa nama"}`
      );
      console.log(error.message);
    }
  }

  console.log("================================");
  console.log("IMPORT SELESAI");
  console.log("BERHASIL:", berhasil);
  console.log("GAGAL:", gagal);
  console.log("PRODUK BARU:", dibuat);
  console.log("SUDAH ADA:", dilewati);
  console.log("TOTAL:", data.length);
  console.log("================================");
}

main()
  .catch((error) => {
    console.error("IMPORT ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
