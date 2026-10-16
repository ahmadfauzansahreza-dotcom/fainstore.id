const fs = require("fs");
const { execSync } = require("child_process");

const data = JSON.parse(
  fs.readFileSync("data-produk-10-08-26.json", "utf8")
);

let berhasil = 0;
let gagal = 0;

function esc(value) {
  return String(value ?? "").replace(/'/g, "''");
}

for (const p of data) {
  const slug = String(p.kode_produk ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const harga = Number(p.harga_rupiah) || 0;
  const status = p.status === "aktif";

  const sql = `
INSERT INTO "Product"
("id", "name", "slug", "type", "priceIdr", "status")
VALUES (
  '${esc(p.kode_produk)}',
  '${esc(p.nama)}',
  '${slug}',
  'TOPUP',
  ${harga},
  ${status}
)
ON CONFLICT ("id") DO NOTHING;
`;

  try {
    execSync(
      `psql -d fainstore -c ${JSON.stringify(sql)}`,
      { stdio: "ignore" }
    );
    berhasil++;
  } catch (e) {
    gagal++;
  }
}

console.log("Import selesai!");
console.log("Berhasil:", berhasil);
console.log("Gagal:", gagal);
