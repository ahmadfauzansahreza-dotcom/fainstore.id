import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const updateSchema = z.object({
  deliveryStatus: z.string().optional(),
  adminNotes: z.string().optional(),
  // Catatan: status PEMBAYARAN tidak bisa diubah manual di sini — itu hanya berubah lewat webhook Midtrans terverifikasi.
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const order = await db.order.update({ where: { id }, data: { deliveryStatus: parsed.data.deliveryStatus } });
  await logAdminAction(admin.id, "ORDER_UPDATED", { orderId: id });

  return NextResponse.json(order);
}
