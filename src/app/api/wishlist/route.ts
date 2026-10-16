import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const wishlist = await db.wishlist.findMany({
    where: { userId },
    include: { product: { include: { images: { take: 1 }, game: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: wishlist });
}

const schema = z.object({ productId: z.string() });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const existing = await db.wishlist.findUnique({
    where: { userId_productId: { userId, productId: parsed.data.productId } },
  });

  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ status: "removed" });
  }

  const created = await db.wishlist.create({ data: { userId, productId: parsed.data.productId } });
  return NextResponse.json({ status: "added", item: created }, { status: 201 });
}
