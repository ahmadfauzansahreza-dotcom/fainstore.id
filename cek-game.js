const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const games = await db.game.findMany({
    where: {
      name: {
        contains: "Mobile",
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  console.log(JSON.stringify(games, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
