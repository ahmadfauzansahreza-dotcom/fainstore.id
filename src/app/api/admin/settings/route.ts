import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const settings = (await db.settings.findFirst()) ?? (await db.settings.create({ data: {} }));
  return NextResponse.json(settings);
}

const schema = z.object({
  storeName: z.string().optional(),
  storeDescription: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  discord: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  warrantyPolicy: z.string().optional(),
  termsContent: z.string().optional(),
  privacyContent: z.string().optional(),
  refundPolicyContent: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  // Hanya SUPER_ADMIN yang boleh mengubah pengaturan sistem sensitif (poin 43).
  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat mengubah pengaturan ini." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const existing = (await db.settings.findFirst()) ?? (await db.settings.create({ data: {} }));
  const updated = await db.settings.update({ where: { id: existing.id }, data: parsed.data });

  await logAdminAction(admin.id, "SETTINGS_CHANGED", { fields: Object.keys(parsed.data) });

  return NextResponse.json(updated);
}
