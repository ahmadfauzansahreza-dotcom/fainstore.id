import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { vipaymentProvider } from "@/lib/providers/vipayment";

const schema = z.object({
  productCode: z.string().min(1),
  customerNo: z.string().min(1),
  serverNo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Data pengecekan tidak valid." },
        { status: 400 }
      );
    }

    const { productCode, customerNo, serverNo } = parsed.data;

    const result = await vipaymentProvider.getNickname(
      productCode,
      customerNo,
      serverNo
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("[VIPAYMENT NICKNAME]", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengecek ID melalui VIPayment.",
      },
      { status: 500 }
    );
  }
}
