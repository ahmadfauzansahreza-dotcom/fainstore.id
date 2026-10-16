const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  const games = await db.game.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  console.log("TOTAL GAME:", games.length);
  console.log("==============================");

  for (const game of games) {
    console.log(
      game.id,
      "|",
      game.name,
      "|",
      game.slug
    );
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
