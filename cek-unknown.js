const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./data-produk-10-08-26.json", "utf8")
);

const ids = [17, 29, 110, 124];

for (const id of ids) {
  console.log("\n==============================");
  console.log("OPERATOR", id);
  console.log("==============================");

  const products = data.filter(x => Number(x.operator_id) === id);

  for (const x of products) {
    console.log(
      x.kode_produk,
      "|",
      x.nama,
      "| harga:",
      x.harga_rupiah
    );
  }

  console.log("TOTAL:", products.length);
}
