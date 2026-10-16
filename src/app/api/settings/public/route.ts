import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Endpoint publik — HANYA mengembalikan field yang aman ditampilkan ke browser.
export async function GET() {
  const settings = await db.settings.findFirst();

  return NextResponse.json({
    storeName: settings?.storeName ?? "FAIN STORE",
    maintenanceMode: settings?.maintenanceMode ?? false,
    whatsappNumber: settings?.whatsappNumber ?? null,
    email: settings?.email ?? null,
    instagram: settings?.instagram ?? null,
    tiktok: settings?.tiktok ?? null,
    discord: settings?.discord ?? null,
  });
}
