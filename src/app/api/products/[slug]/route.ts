import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug, status: true, deletedAt: null },
    include: {
      images: { orderBy: { position: "asc" } },
      game: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      // Hanya hitung stok tersedia — TIDAK PERNAH mengembalikan usernameEmailEnc/passwordEnc/recoveryDataEnc.
      _count: { select: { gameAccounts: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  const availableStock =
    product.type === "GAME_ACCOUNT"
      ? await db.gameAccount.count({ where: { productId: product.id, status: "AVAILABLE" } })
      : product.stockQty;

  return NextResponse.json({ ...product, availableStock });
}
