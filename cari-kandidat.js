const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const games = await db.game.findMany({
    where: {
      OR: [
        { name: { contains: "Crystal", mode: "insensitive" } },
        { name: { contains: "Diamond", mode: "insensitive" } },
        { name: { contains: "RC", mode: "insensitive" } },
        { name: { contains: "DGH", mode: "insensitive" } },
        { name: { contains: "Growth", mode: "insensitive" } },
        { name: { contains: "Glory", mode: "insensitive" } },
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

  console.log("===== KANDIDAT GAME =====");

  for (const game of games) {
    console.log(game.id, "|", game.name, "|", game.slug);
  }

  console.log("TOTAL:", games.length);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
