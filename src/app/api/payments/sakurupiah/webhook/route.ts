import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fulfillOrder } from "@/lib/fulfillment";

const API_KEY = process.env.SAKURUPIAH_API_KEY!;

function verifyCallbackSignature(rawBody: string, received: string) {
  if (!API_KEY || !received) return false;

  const expected = crypto
    .createHmac("sha256", API_KEY)
    .update(rawBody)
    .digest("hex");

  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(received),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const callbackSignature =
      request.headers.get("x-callback-signature") ?? "";

    const callbackEvent =
      request.headers.get("x-callback-event") ?? "";

    if (!verifyCallbackSignature(rawBody, callbackSignature)) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
      );
    }

    if (callbackEvent !== "payment_status") {
      return NextResponse.json(
        {
          success: false,
          message: `Unrecognized callback event: ${callbackEvent}`,
        },
        { status: 400 }
      );
    }

    let body: {
      trx_id?: string;
      merchant_ref?: string;
      status?: string;
      status_kode?: number | string;
    };

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data send by payment gateway",
        },
        { status: 400 }
      );
    }

    const trxId = String(body.trx_id ?? "");
    const merchantRef = String(body.merchant_ref ?? "");
    const status = String(body.status ?? "").toLowerCase();
    const statusKode = Number(body.status_kode);

    if (!trxId || !merchantRef) {
      return NextResponse.json(
        { success: false, message: "Data transaksi tidak lengkap" },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({
      where: { providerOrderId: merchantRef },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment tidak ditemukan" },
        { status: 404 }
      );
    }

    let paymentStatus:
      | "PENDING"
      | "PAID"
      | "EXPIRE"
      | "FAILED" = "PENDING";

    let orderStatus:
      | "PENDING"
      | "PROCESSING"
      | "EXPIRED"
      | "CANCELLED" = "PENDING";

    if (status === "berhasil" && statusKode === 1) {
      paymentStatus = "PAID";
      orderStatus = "PROCESSING";
    } else if (status === "expired" && statusKode === 2) {
      paymentStatus = "EXPIRE";
      orderStatus = "EXPIRED";
    } else if (status === "pending" && statusKode === 0) {
      paymentStatus = "PENDING";
      orderStatus = "PENDING";
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Error Data Status Callback",
        },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.paymentEvent.upsert({
        where: {
          providerTransactionId: trxId,
        },
        create: {
          paymentId: payment.id,
          providerTransactionId: trxId,
          eventType: status,
          statusCode: String(statusKode),
          signatureValid: true,
          rawPayload: body,
        },
        update: {},
      }),

      db.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          paidAt:
            paymentStatus === "PAID"
              ? payment.paidAt ?? new Date()
              : payment.paidAt,
          rawResponse: body,
        },
      }),

      db.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
        },
      }),
    ]);

    if (paymentStatus === "PAID") {
      try {
        await fulfillOrder(payment.orderId);
      } catch (fulfillmentError) {
        console.error("SAKURUPIAH FULFILLMENT ERROR:", fulfillmentError);

        return NextResponse.json(
          {
            success: false,
            message: "Pembayaran berhasil, tetapi fulfillment gagal diproses",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment status ${status}`,
    });
  } catch (error) {
    console.error("SAKURUPIAH WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook gagal diproses",
      },
      { status: 500 }
    );
  }
}
