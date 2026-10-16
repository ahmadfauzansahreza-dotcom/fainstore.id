import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/cron/release-reservations
 *
 * Jaring pengaman: jika customer membuat order lalu MENUTUP Snap tanpa
 * pernah membayar sama sekali, Midtrans bisa jadi tidak pernah mengirim
 * notifikasi expire (karena transaksi Snap belum benar-benar terjadi).
 * Endpoint ini melepas reservasi akun yang sudah lewat `reservedUntil`
 * dan pesanan terkait yang masih PENDING lebih dari waktu reservasi.
 *
 * Jadwalkan lewat Vercel Cron (vercel.json) memanggil endpoint ini setiap
 * beberapa menit. Lindungi dengan CRON_SECRET agar tidak bisa dipicu publik.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const now = new Date();

  const expiredAccounts = await db.gameAccount.findMany({
    where: { status: "RESERVED", reservedUntil: { lt: now } },
    select: { id: true, orderItemId: true },
  });

  if (expiredAccounts.length === 0) {
    return NextResponse.json({ released: 0 });
  }

  const orderItemIds = expiredAccounts.map((a: any) => a.orderItemId).filter((id: any): id is string => !!id);

  await db.$transaction(async (tx: any) => {
    await tx.gameAccount.updateMany({
      where: { id: { in: expiredAccounts.map((a: any) => a.id) } },
      data: { status: "AVAILABLE", orderItemId: null, reservedUntil: null },
    });

    if (orderItemIds.length > 0) {
      const orderItems = await tx.orderItem.findMany({
        where: { id: { in: orderItemIds } },
        select: { orderId: true },
      });
      const orderIds = [...new Set(orderItems.map((i: any) => i.orderId))];

      await tx.order.updateMany({
        where: { id: { in: orderIds }, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
    }
  });

  return NextResponse.json({ released: expiredAccounts.length });
}
