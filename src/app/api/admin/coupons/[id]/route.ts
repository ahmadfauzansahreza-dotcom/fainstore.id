import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const updateSchema = z.object({ isActive: z.boolean().optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const coupon = await db.coupon.update({ where: { id }, data: parsed.data });
  await logAdminAction(admin.id, "COUPON_UPDATED", { couponId: id });

  return NextResponse.json(coupon);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  await db.coupon.delete({ where: { id } });
  await logAdminAction(admin.id, "COUPON_DELETED", { couponId: id });

  return NextResponse.json({ status: "deleted" });
}
