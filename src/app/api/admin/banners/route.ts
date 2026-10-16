import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const bannerSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET() {
  const banners = await db.banner.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json({ items: banners });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = bannerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data banner tidak valid." }, { status: 400 });
  const input = parsed.data;

  const banner = await db.banner.create({
    data: {
      title: input.title,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      position: input.position,
      isActive: input.isActive,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });

  await logAdminAction(admin.id, "BANNER_CREATED", { bannerId: banner.id });

  return NextResponse.json(banner, { status: 201 });
}
