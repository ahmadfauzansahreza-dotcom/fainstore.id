import { db } from "./src/lib/db";

async function main() {
  console.log("========================================");
  console.log("FAIN STORE — V4.8.3 DB CONNECTION AUDIT");
  console.log("READ ONLY — NO DATABASE CHANGES");
  console.log("========================================");

  console.log("");

  const result = await db.$queryRaw<
    Array<{ ok: number; now: Date }>
  >`SELECT 1 AS ok, NOW() AS now`;

  console.log("DATABASE CONNECTION : PASS");
  console.log("QUERY RESULT        :", result[0]);

  console.log("");
  console.log("DATABASE TIDAK DIUBAH");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("DATABASE CONNECTION : FAIL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
