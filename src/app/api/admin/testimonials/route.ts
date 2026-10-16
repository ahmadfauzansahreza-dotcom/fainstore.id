import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const schema = z.object({
  customerName: z.string().min(1),
  content: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  avatarUrl: z.string().url().optional(),
  position: z.number().int().default(0),
  isApproved: z.boolean().default(false),
});

// Publik: hanya testimonial yang sudah disetujui admin yang tampil di storefront.
export async function GET() {
  const testimonials = await db.testimonial.findMany({
    where: { isApproved: true },
    orderBy: { position: "asc" },
  });
  return NextResponse.json({ items: testimonials });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data testimoni tidak valid." }, { status: 400 });

  const testimonial = await db.testimonial.create({ data: parsed.data });
  await logAdminAction(admin.id, "TESTIMONIAL_CREATED", { testimonialId: testimonial.id });

  return NextResponse.json(testimonial, { status: 201 });
}
