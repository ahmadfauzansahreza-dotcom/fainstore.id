import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSakurupiahInvoice } from "@/lib/sakurupiah";
import { sendEmailNotification } from "@/lib/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  couponCode: z.string().optional(),

  // Data transaksi TOPUP.
  // Hanya dikirim oleh checkout TOPUP.
  topUp: z
    .object({
      productId: z.string().min(1),
      gameUid: z.string().min(1),
      serverId: z.string().optional(),
    })
    .optional(),
});

const RESERVATION_MINUTES = 15;

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  const { allowed } = rateLimit(
    `create-order:${clientIp}`,
    10,
    60_000
  );

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "Terlalu banyak percobaan. Silakan coba beberapa saat lagi.",
      },
      { status: 429 }
    );
  }

  const parsed = createOrderSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data pesanan tidak valid.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Validasi TOPUP sebelum membuat order.
  if (input.topUp) {
    const topUpItem = input.items.find(
      (item) => item.productId === input.topUp!.productId
    );

    if (!topUpItem) {
      return NextResponse.json(
        {
          error: "Produk top up tidak ditemukan di item pesanan.",
        },
        { status: 400 }
      );
    }

    const topUpProduct = await db.product.findUnique({
      where: { id: input.topUp.productId },
      select: {
        id: true,
        type: true,
        status: true,
        deletedAt: true,
      },
    });

    if (
      !topUpProduct ||
      topUpProduct.type !== "TOPUP" ||
      !topUpProduct.status ||
      topUpProduct.deletedAt
    ) {
      return NextResponse.json(
        {
          error: "Produk top up tidak valid.",
        },
        { status: 400 }
      );
    }
  }

  

  try {
    const order = await db.$transaction(async (tx: any) => {
      let subtotal = 0;

      const orderItemsData: {
        productId: string;
        quantity: number;
        priceIdr: number;
        gameAccountId?: string;
      }[] = [];

      for (const line of input.items) {
        const product = await tx.product.findUnique({
          where: {
            id: line.productId,
            status: true,
          },
        });

        if (!product) {
          throw new OrderError("Produk sudah tidak tersedia.");
        }

        if (product.type === "GAME_ACCOUNT") {
          if (line.quantity !== 1) {
            throw new OrderError(
              "Akun game hanya bisa dibeli 1 per pesanan."
            );
          }

          const [account] = await tx.$queryRaw<
            { id: string }[]
          >`
            SELECT id
            FROM "GameAccount"
            WHERE "productId" = ${product.id}
              AND status = 'AVAILABLE'
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          `;

          if (!account) {
            throw new OrderError(
              `Stok untuk "${product.name}" sudah habis.`
            );
          }

          await tx.gameAccount.update({
            where: {
              id: account.id,
            },
            data: {
              status: "RESERVED",
              reservedUntil: new Date(
                Date.now() + RESERVATION_MINUTES * 60_000
              ),
            },
          });

          orderItemsData.push({
            productId: product.id,
            quantity: 1,
            priceIdr: product.priceIdr,
            gameAccountId: account.id,
          });

          subtotal += product.priceIdr;
        } else {
          if (product.stockQty < line.quantity) {
            throw new OrderError(
              `Stok untuk "${product.name}" tidak mencukupi.`
            );
          }

          await tx.product.update({
            where: {
              id: product.id,
            },
            data: {
              stockQty: {
                decrement: line.quantity,
              },
            },
          });

          orderItemsData.push({
            productId: product.id,
            quantity: line.quantity,
            priceIdr: product.priceIdr,
          });

          subtotal += product.priceIdr * line.quantity;
        }
      }

      let discount = 0;
      let couponId: string | undefined;

      if (input.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: {
            code: input.couponCode,
          },
        });

        const now = new Date();

        if (
          !coupon ||
          !coupon.isActive ||
          coupon.startDate > now ||
          coupon.endDate < now
        ) {
          throw new OrderError(
            "Kupon tidak valid atau sudah kedaluwarsa."
          );
        }

        if (
          coupon.minPurchaseIdr &&
          subtotal < coupon.minPurchaseIdr
        ) {
          throw new OrderError(
            "Total belanja belum memenuhi syarat minimum kupon."
          );
        }

        discount =
          coupon.discountType === "PERCENTAGE"
            ? Math.min(
                Math.floor(
                  (subtotal * (coupon.percentage ?? 0)) / 100
                ),
                coupon.maxDiscountIdr ?? Infinity
              )
            : coupon.fixedAmountIdr ?? 0;

        couponId = coupon.id;
      }

      const total = Math.max(subtotal - discount, 0);

      const orderNumber = `FS${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes,
          subtotalIdr: subtotal,
          discountIdr: discount,
          totalIdr: total,
          couponId,
          status: "PENDING",

          // TOPUP menggunakan model TopUpOrder yang sudah ada.
          // GAME_ACCOUNT tetap menggunakan flow existing.
          topUpOrder: input.topUp
            ? {
                create: {
                  gameUid: input.topUp.gameUid,
                  serverId: input.topUp.serverId || null,
                  status: "PAID",
                },
              }
            : undefined,

          items: {
            create: orderItemsData.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              priceIdr: i.priceIdr,
            })),
          },
        },

        include: {
          items: true,
        },
      });

      // Hubungkan akun game yang direservasi ke OrderItem
      for (let idx = 0; idx < orderItemsData.length; idx++) {
        const gameAccountId =
          orderItemsData[idx].gameAccountId;

        if (gameAccountId) {
          await tx.gameAccount.update({
            where: {
              id: gameAccountId,
            },
            data: {
              orderItemId: createdOrder.items[idx].id,
            },
          });
        }
      }

      return createdOrder;
    });

    /*
     * Buat transaksi Midtrans di luar DB transaction.
     *
     * PENTING:
     * Harga item sekarang diambil dari order.items.priceIdr,
     * BUKAN price: 0 lagi.
     */
    const paymentMethod =
      typeof (input as any).paymentMethod === "string" &&
      (input as any).paymentMethod.trim()
        ? (input as any).paymentMethod.trim()
        : "QRIS";

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const payment = await createSakurupiahInvoice({
      method: paymentMethod,
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone,
      amount: Number(order.totalIdr),
      merchantRef: order.orderNumber,
      callbackUrl: `${baseUrl}/api/payments/sakurupiah/webhook`,
      returnUrl: `${baseUrl}/order/${order.id}`,
    });

    await db.payment.create({
      data: {
        orderId: order.id,
        providerOrderId: order.orderNumber,
        paymentReference:
          payment?.data?.[0]?.checkout_url ||
          payment?.data?.[0]?.payment_url ||
          payment?.data?.[0]?.qr ||
          payment?.checkout_url ||
          payment?.payment_url ||
          null,
        method: paymentMethod,
        status: "PENDING",
        grossAmountIdr: Number(order.totalIdr),
        rawResponse: payment,
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentReference:
          payment?.data?.[0]?.checkout_url ||
          payment?.data?.[0]?.payment_url ||
          payment?.data?.[0]?.qr ||
          payment?.checkout_url ||
          payment?.payment_url ||
          null,
        payment: payment,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        {
          error: err.message,
        },
        { status: 409 }
      );
    }

    console.error("Gagal membuat order:", err);

    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan saat membuat pesanan. Silakan coba kembali.",
      },
      { status: 500 }
    );
  }
}

class OrderError extends Error {}
