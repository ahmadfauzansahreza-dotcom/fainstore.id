const fs = require("fs");

const file = "./data-produk-10-08-26.json";

if (!fs.existsSync(file)) {
  console.error("File tidak ditemukan:", file);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));

const operators = new Map();

for (const item of data) {
  const id = String(item.operator_id ?? "unknown");

  if (!operators.has(id)) {
    operators.set(id, {
      operator_id: item.operator_id,
      total: 0,
      products: []
    });
  }

  const op = operators.get(id);
  op.total++;

  op.products.push({
    code: item.kode_produk,
    name: item.nama,
    unit: item.harga_unit,
    price: item.harga_rupiah,
    status: item.status
  });
}

const report = [...operators.values()].sort(
  (a, b) => Number(a.operator_id) - Number(b.operator_id)
);

fs.writeFileSync(
  "./operator-report.json",
  JSON.stringify(report, null, 2)
);

console.log("=================================");
console.log(" FAIN STORE - OPERATOR REPORT");
console.log("=================================");
console.log("Total produk :", data.length);
console.log("Total operator:", report.length);
console.log("");
console.log("Report dibuat:");
console.log("./operator-report.json");
console.log("");

for (const op of report) {
  console.log(
    `OPERATOR ${op.operator_id} -> ${op.total} produk -> ${op.products[0]?.name || "-"}`
  );
}
