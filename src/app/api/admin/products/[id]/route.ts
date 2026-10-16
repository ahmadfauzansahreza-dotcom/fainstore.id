import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";
import { updateProductSchema } from "@/lib/validators/product";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const parsed = updateProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data produk tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  }

  const before = await db.product.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  const input = parsed.data;
  const updated = await db.product.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      specifications: input.specifications as never,
      priceIdr: input.priceIdr,
      originalPriceIdr: input.originalPriceIdr,
      discountPct: input.discountPct,
      stockQty: input.stockQty,
      warranty: input.warranty,
      isFeatured: input.isFeatured,
      isBestSeller: input.isBestSeller,
      isFlashSale: input.isFlashSale,
    },
  });

  // Catat perubahan harga secara khusus di audit log — ini tindakan sensitif.
  if (input.priceIdr !== undefined && input.priceIdr !== before.priceIdr) {
    await logAdminAction(admin.id, "PRODUCT_PRICE_CHANGED", {
      productId: id,
      from: before.priceIdr,
      to: input.priceIdr,
    });
  }
  await logAdminAction(admin.id, "PRODUCT_UPDATED", { productId: id });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  // Soft delete — mempertahankan riwayat order yang mereferensikan produk ini.
  await db.product.update({ where: { id }, data: { deletedAt: new Date(), status: false } });
  await logAdminAction(admin.id, "PRODUCT_DELETED", { productId: id, name: product.name });

  return NextResponse.json({ status: "deleted" });
}
