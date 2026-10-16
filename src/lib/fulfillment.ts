import { db } from "@/lib/db";
import { sendEmailNotification, sendWhatsAppNotification } from "@/lib/notifications";

/**
 * Menjalankan fulfillment untuk sebuah order yang sudah terverifikasi PAID.
 * Aman dipanggil berkali-kali (idempoten) — hanya bertindak pada item yang belum di-fulfill.
 */
export async function fulfillOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true, gameAccount: true } },
      topUpOrder: true,
    },
  });

  if (!order) return;

  for (const item of order.items) {
    if (item.product.type === "GAME_ACCOUNT" && item.gameAccount) {
      if (item.gameAccount.status === "SOLD") continue; // sudah pernah difulfill

      await db.gameAccount.update({
        where: { id: item.gameAccount.id },
        data: { status: "SOLD", soldAt: new Date() },
      });

      await db.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: 1 } },
      });

      // TODO: kirim notifikasi email/WhatsApp bahwa kredensial sudah tersedia di halaman order.
      // Kredensial TIDAK dikirim mentah lewat notifikasi — customer melihatnya lewat halaman
      // order yang sudah diautentikasi, untuk menghindari kebocoran lewat log/channel pihak ketiga.
    }
  }

  let topUpCompleted = true;

  if (order.topUpOrder && order.topUpOrder.status === "PAID") {
    await processTopUp(order.id);

    const updatedTopUp = await db.topUpOrder.findUnique({
      where: { orderId: order.id },
      select: { status: true },
    });

    topUpCompleted = updatedTopUp?.status === "COMPLETED";
  } else if (order.topUpOrder) {
    topUpCompleted = order.topUpOrder.status === "COMPLETED";
  }

  const allAccountItemsSold = order.items
    .filter((i: (typeof order.items)[number]) => i.product.type === "GAME_ACCOUNT")
    .every((i: (typeof order.items)[number]) => i.gameAccount?.status === "SOLD");

  if (allAccountItemsSold && topUpCompleted) {
    await db.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    });
  }

  const notifyMessage =
    `Pesanan ${order.orderNumber} telah berhasil dibayar. ` +
    `Silakan cek halaman pesanan Anda untuk melihat detail${
      order.items.some((i: (typeof order.items)[number]) => i.product.type === "GAME_ACCOUNT") ? " dan kredensial akun" : ""
    }.`;

  await Promise.all([
    sendEmailNotification({
      event: "PAYMENT_SUCCESSFUL",
      toEmail: order.customerEmail,
      orderNumber: order.orderNumber,
      message: notifyMessage,
    }),
    sendWhatsAppNotification({
      event: "PAYMENT_SUCCESSFUL",
      toWhatsApp: order.customerPhone,
      orderNumber: order.orderNumber,
      message: notifyMessage,
    }),
  ]);
}

async function processTopUp(orderId: string) {
  const { vipaymentProvider } = await import("@/lib/providers/vipayment");

  const topUpOrder = await db.topUpOrder.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!topUpOrder) return;

    // Jangan membuat transaksi VIPayment kedua jika order
    // sudah memiliki providerRef dari transaksi sebelumnya.
    if (topUpOrder.providerRef?.trim()) {
      console.log(
        "[VIPAYMENT] Order sudah memiliki providerRef, skip createOrder:",
        topUpOrder.providerRef
      );
      return;
    }

  const product = topUpOrder.order.items[0]?.product;

  if (!product) {
    throw new Error(`Product tidak ditemukan untuk order ${orderId}`);
  }

  const specifications =
    product.specifications &&
    typeof product.specifications === "object" &&
    !Array.isArray(product.specifications)
      ? (product.specifications as Record<string, unknown>)
      : null;

  const provider =
    typeof specifications?.provider === "string"
      ? specifications.provider
      : "";

  const productCode =
    typeof specifications?.code === "string"
      ? specifications.code
      : "";

  if (provider !== "vipayment") {
    throw new Error(
      `Product ${product.id} bukan product VIPayment`
    );
  }

  if (!productCode.trim()) {
    throw new Error(
      `VIPayment product code tidak ditemukan untuk product ${product.id}`
    );
  }

  const result = await vipaymentProvider.createOrder({
    reference: topUpOrder.order.orderNumber,
    productCode,
    customerNo: topUpOrder.gameUid,
    serverNo: topUpOrder.serverId ?? undefined,
  });

  console.log("VIPAYMENT CREATE ORDER RESPONSE:", JSON.stringify(result, null, 2));

  const providerReference =
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data) &&
    typeof (result.data as Record<string, unknown>).trxid === "string"
      ? String((result.data as Record<string, unknown>).trxid).trim()
      : "";

  if (!result.success || !providerReference) {
    await db.topUpOrder.update({
      where: { orderId },
      data: {
        status: "PROCESSING",
        providerRef: providerReference || null,
      },
    });

    console.log(
      "[VIPAYMENT] createOrder belum menghasilkan trxid:",
      JSON.stringify(result)
    );

    return;
  }

  const statusResult =
    await vipaymentProvider.checkOrder(providerReference);

  console.log(
    "[VIPAYMENT] status response:",
    JSON.stringify(statusResult, null, 2)
  );

  const vipaymentStatus =
    typeof statusResult.status === "string"
      ? statusResult.status.toLowerCase()
      : "";

    const topUpStatus =
      vipaymentStatus === "success"
        ? "COMPLETED"
        : vipaymentStatus === "error"
          ? "FAILED"
          : "PROCESSING";

  await db.topUpOrder.update({
    where: { orderId },
    data: {
      status: topUpStatus,
      providerRef: providerReference,
    },
  });

  console.log("[VIPAYMENT] createOrder result:", JSON.stringify(result));
}
