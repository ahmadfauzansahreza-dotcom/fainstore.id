import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const revalidate = 60;

const getCachedGames = unstable_cache(
  async () => {
    return db.game.findMany({
      where: { isActive: true },
      include: { categories: true },
      orderBy: { name: "asc" },
    });
  },
  ["fain-store-games"],
  {
    revalidate: 60,
  }
);

export async function GET() {
  try {
    const games = await getCachedGames();

    return NextResponse.json(
      { items: games },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/games error:", error);

    return NextResponse.json(
      { items: [], error: "Gagal mengambil daftar game" },
      { status: 500 }
    );
  }
}
