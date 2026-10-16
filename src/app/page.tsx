import HomePage from "./home-client";
import { db } from "@/lib/db";

export const revalidate = 60;

export default async function Page() {
  const games = await db.game.findMany({
    where: { isActive: true },
    include: { categories: true },
    orderBy: { name: "asc" },
  });

  return <HomePage initialGames={games} />;
}
