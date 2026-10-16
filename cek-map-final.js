const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const games = await db.game.findMany({
    where: {
      OR: [
        { name: { contains: "Mobile Legend", mode: "insensitive" } },
        { name: { contains: "Call of Duty", mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true
    },
    orderBy: {
      name: "asc"
    }
  });

  console.log("===== GAME YANG AKAN DIPAKAI =====");

  for (const game of games) {
    console.log(game.id, "|", game.name, "|", game.slug);
  }

  console.log("\nTOTAL:", games.length);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
