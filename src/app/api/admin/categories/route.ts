import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const schema = z.object({ name: z.string().min(1), gameId: z.string() });

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data kategori tidak valid." }, { status: 400 });

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await db.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const category = await db.category.create({ data: { name: parsed.data.name, slug, gameId: parsed.data.gameId } });
  await logAdminAction(admin.id, "CATEGORY_CREATED", { categoryId: category.id });

  return NextResponse.json(category, { status: 201 });
}
