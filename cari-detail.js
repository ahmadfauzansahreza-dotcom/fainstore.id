const data = require("./data-produk-10-08-26.json");

const ids = [17, 29, 110, 124];

for (const id of ids) {
  console.log("\n================================");
  console.log("OPERATOR:", id);
  console.log("================================");

  const products = data.filter(x => Number(x.operator_id) === id);

  for (const x of products) {
    console.log(
      "kode:", x.kode_produk,
      "| nama:", x.nama
    );
  }

  console.log("TOTAL:", products.length);
}
