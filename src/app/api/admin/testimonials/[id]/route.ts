import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const schema = z.object({ isApproved: z.boolean().optional(), position: z.number().int().optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const testimonial = await db.testimonial.update({ where: { id }, data: parsed.data });
  await logAdminAction(admin.id, "TESTIMONIAL_UPDATED", { testimonialId: id });

  return NextResponse.json(testimonial);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  await db.testimonial.delete({ where: { id } });
  await logAdminAction(admin.id, "TESTIMONIAL_DELETED", { testimonialId: id });

  return NextResponse.json({ status: "deleted" });
}
