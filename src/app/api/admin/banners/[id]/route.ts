import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  await db.banner.delete({ where: { id } });
  await logAdminAction(admin.id, "BANNER_DELETED", { bannerId: id });

  return NextResponse.json({ status: "deleted" });
}
