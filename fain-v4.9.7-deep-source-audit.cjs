const fs = require("fs");

const targets = new Set([
  "NHAGO9200",
  "NHAGO18200",
  "NHAGO45600",
  "NHAGO76200",
  "NHAGO61K",
  "NHAGO155K"
]);

const files = [
  "catalog-products.json",
  "master-product-map.json"
];

console.log("========================================");
console.log("FAIN STORE — V4.9.7 DEEP SOURCE AUDIT");
console.log("READ ONLY — NO DATABASE CHANGES");
console.log("========================================");

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("");
    console.log("FILE MISSING :", file);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  function walk(value, path = "$") {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        walk(value[i], `${path}[${i}]`);
      }
      return;
    }

    if (!value || typeof value !== "object") return;

    const code =
      value.code ??
      value.product_code ??
      value.productCode ??
      value.sku;

    const name = value.name;

    if (
      (code && targets.has(String(code))) ||
      (name && targets.has(String(name)))
    ) {
      console.log("");
      console.log(`===== ${file} =====`);
      console.log("PATH :", path);
      console.log(JSON.stringify(value, null, 2));
    }

    for (const [key, child] of Object.entries(value)) {
      walk(child, `${path}.${key}`);
    }
  }

  walk(data);
}

console.log("");
console.log("========================================");
console.log("V4.9.7 DEEP SOURCE AUDIT SELESAI");
console.log("DATABASE TIDAK DIUBAH");
console.log("========================================");
