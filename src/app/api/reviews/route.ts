import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Silakan masuk untuk memberi ulasan." }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data ulasan tidak valid." }, { status: 400 });
  }
  const { productId, rating, comment, imageUrl } = parsed.data;

  // Verifikasi bahwa user benar-benar pernah membeli & pesanan sudah selesai.
  const hasPurchased = await db.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: "COMPLETED" },
    },
  });
  if (!hasPurchased) {
    return NextResponse.json({ error: "Anda hanya bisa mengulas produk yang sudah Anda beli." }, { status: 403 });
  }

  const existing = await db.review.findUnique({ where: { productId_userId: { productId, userId } } });
  if (existing) {
    return NextResponse.json({ error: "Anda sudah pernah memberi ulasan untuk produk ini." }, { status: 409 });
  }

  const review = await db.review.create({
    data: { productId, userId, rating, comment, imageUrl, isApproved: false },
  });

  return NextResponse.json(review, { status: 201 });
}
