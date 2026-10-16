import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fulfillOrder } from "@/lib/fulfillment";

const API_ID = process.env.VIPAYMENT_API_ID || "";
const API_KEY = process.env.VIPAYMENT_API_KEY || "";

function getExpectedSignature() {
  return crypto
    .createHash("md5")
    .update(API_ID + API_KEY)
    .digest("hex");
}

type VIPaymentWebhookData = {
  trxid?: unknown;
  data?: unknown;
  zone?: unknown;
  service?: unknown;
  status?: unknown;
  note?: unknown;
  price?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    if (!API_ID || !API_KEY) {
      console.error("[VIPAYMENT WEBHOOK] Credential belum dikonfigurasi.");
      return NextResponse.json(
        { success: false, message: "Webhook credential belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const receivedSignature =
      request.headers.get("x-client-signature") || "";

    const expectedSignature = getExpectedSignature();

    const receivedBuffer = Buffer.from(receivedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    const signatureValid =
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!signatureValid) {
      console.warn("[VIPAYMENT WEBHOOK] Signature tidak valid.");
      return NextResponse.json(
        { success: false, message: "Invalid signature." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = body?.data as VIPaymentWebhookData | undefined;

    const trxid =
      typeof data?.trxid === "string"
        ? data.trxid.trim()
        : "";

    const status =
      typeof data?.status === "string"
        ? data.status.trim().toLowerCase()
        : "";

    if (!trxid || !status) {
      return NextResponse.json(
        { success: false, message: "Data webhook tidak lengkap." },
        { status: 400 }
      );
    }

    const topUpOrder = await db.topUpOrder.findFirst({
      where: {
        providerRef: trxid,
      },
    });

    if (!topUpOrder) {
      console.warn(
        "[VIPAYMENT WEBHOOK] TopUpOrder tidak ditemukan:",
        trxid
      );

      return NextResponse.json(
        { success: false, message: "Transaction not found." },
        { status: 404 }
      );
    }

    console.log(
      "[VIPAYMENT WEBHOOK]",
      JSON.stringify(
        {
          trxid,
          status,
          note: data?.note ?? "",
          service: data?.service ?? "",
          price: data?.price ?? null,
        },
        null,
        2
      )
    );

    if (status === "waiting" || status === "processing") {
      await db.topUpOrder.update({
        where: { orderId: topUpOrder.orderId },
        data: {
          status: "PROCESSING",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Status VIPayment diterima.",
      });
    }

    if (status === "success") {
      await db.topUpOrder.update({
        where: { orderId: topUpOrder.orderId },
        data: {
          status: "COMPLETED",
          providerRef: trxid,
        },
      });

      await fulfillOrder(topUpOrder.orderId);

      return NextResponse.json({
        success: true,
        message: "VIPayment transaction completed.",
      });
    }

    if (status === "error") {
      console.error(
        "[VIPAYMENT WEBHOOK] Transaksi error:",
        JSON.stringify(
          {
            trxid,
            note: data?.note ?? "",
          },
          null,
          2
        )
      );

      await db.topUpOrder.update({
        where: { orderId: topUpOrder.orderId },
        data: {
          status: "FAILED",
          providerRef: trxid,
        },
      });

      return NextResponse.json({
        success: true,
        message: "VIPayment error status diterima.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Status VIPayment tidak dikenali: ${status}`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[VIPAYMENT WEBHOOK ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook gagal diproses.",
      },
      { status: 500 }
    );
  }
}
