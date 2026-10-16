import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, payment: true, invoice: true },
  });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });

  let invoice = order.invoice;
  if (!invoice) {
    const invoiceNumber = `INV-${order.orderNumber}`;
    invoice = await db.invoice.create({ data: { orderId: order.id, invoiceNumber } });
  }

  return NextResponse.json({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    storeName: "FAIN STORE",
    orderNumber: order.orderNumber,
    customer: { name: order.customerName, email: order.customerEmail },
    items: order.items.map((i: any) => ({ name: i.product.name, quantity: i.quantity, priceIdr: i.priceIdr })),
    subtotalIdr: order.subtotalIdr,
    discountIdr: order.discountIdr,
    feeIdr: order.feeIdr,
    totalIdr: order.totalIdr,
    paymentStatus: order.payment?.status ?? "PENDING",
    createdAt: order.createdAt,
  });
}
