import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";
import { createProductSchema } from "@/lib/validators/product";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const products = await db.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { game: true, category: true, images: true },
  });

  return NextResponse.json({ items: products });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = createProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data produk tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const product = await db.product.create({
    data: {
      name: input.name,
      slug,
      type: input.type,
      gameId: input.gameId,
      categoryId: input.categoryId,
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
      images: { create: input.images.map((url, position) => ({ url, position })) },
    },
  });

  await logAdminAction(admin.id, "PRODUCT_CREATED", { productId: product.id, name: product.name });

  return NextResponse.json(product, { status: 201 });
}
