import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({ code: z.string().min(1), subtotalIdr: z.number().int().nonnegative() });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const { code, subtotalIdr } = parsed.data;

  const coupon = await db.coupon.findUnique({ where: { code } });
  const now = new Date();

  if (!coupon || !coupon.isActive || coupon.startDate > now || coupon.endDate < now) {
    return NextResponse.json({ error: "Kupon tidak valid atau sudah kedaluwarsa." }, { status: 404 });
  }
  if (coupon.minPurchaseIdr && subtotalIdr < coupon.minPurchaseIdr) {
    return NextResponse.json({ error: "Total belanja belum memenuhi syarat minimum kupon." }, { status: 400 });
  }
  if (coupon.usageLimit) {
    const usageCount = await db.couponUsage.count({ where: { couponId: coupon.id } });
    if (usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Kupon sudah mencapai batas penggunaan." }, { status: 400 });
    }
  }

  const discount =
    coupon.discountType === "PERCENTAGE"
      ? Math.min(Math.floor((subtotalIdr * (coupon.percentage ?? 0)) / 100), coupon.maxDiscountIdr ?? Infinity)
      : coupon.fixedAmountIdr ?? 0;

  return NextResponse.json({ valid: true, discountIdr: discount, code: coupon.code });
}
