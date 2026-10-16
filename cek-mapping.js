const data = require("./data-produk-10-08-26.json");

for (const id of [29, 124]) {
  const products = data.filter(x => Number(x.operator_id) === id);

  console.log("\n==============================");
  console.log("OPERATOR:", id);
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

  console.log("TOTAL:", products.length);
}
