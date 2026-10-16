import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const couponSchema = z.object({
  code: z.string().min(3).transform((v) => v.toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  percentage: z.number().int().min(1).max(100).optional(),
  fixedAmountIdr: z.number().int().positive().optional(),
  minPurchaseIdr: z.number().int().nonnegative().optional(),
  maxDiscountIdr: z.number().int().positive().optional(),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items: coupons });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = couponSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data kupon tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const existing = await db.coupon.findUnique({ where: { code: input.code } });
  if (existing) return NextResponse.json({ error: "Kode kupon sudah digunakan." }, { status: 409 });

  const coupon = await db.coupon.create({
    data: {
      code: input.code,
      discountType: input.discountType,
      percentage: input.percentage,
      fixedAmountIdr: input.fixedAmountIdr,
      minPurchaseIdr: input.minPurchaseIdr,
      maxDiscountIdr: input.maxDiscountIdr,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      isActive: input.isActive,
    },
  });

  await logAdminAction(admin.id, "COUPON_CREATED", { couponId: coupon.id, code: coupon.code });

  return NextResponse.json(coupon, { status: 201 });
}
