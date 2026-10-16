const data = require("./data-produk-10-08-26.json");

const ids = [17, 29, 110, 124];

for (const id of ids) {
  const products = data.filter(x => Number(x.operator_id) === id);

  console.log("\n==============================");
  console.log("OPERATOR:", id);
  console.log("TOTAL:", products.length);
  console.log("==============================");

  for (const x of products) {
    console.log(
      x.kode_produk,
      "|",
      x.nama,
      "| harga:",
      x.harga_rupiah
    );
  }
}
