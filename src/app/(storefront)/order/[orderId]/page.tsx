import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatIdr } from "@/lib/money";
import { decryptCredential } from "@/lib/crypto";
import { SUCCESSFUL_PAYMENT_STATUSES } from "@/lib/midtrans";

async function getOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      items: { include: { product: true, gameAccount: true } },
      topUpOrder: true,
    },
  });
  return order;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PROCESSING: "Diproses",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
};

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const isPaid = order.payment ? SUCCESSFUL_PAYMENT_STATUSES.has(order.payment.status) : false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold">Pesanan #{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-gray-400">
        Status: <span className="text-white">{STATUS_LABEL[order.status] ?? order.status}</span>
      </p>

      <div className="mt-6 rounded-xl2 border border-border bg-background-secondary/60 p-4">
        <h3 className="mb-3 text-sm font-semibold">Detail Pesanan</h3>
        <div className="space-y-2 text-sm text-gray-300">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatIdr(item.priceIdr * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span><span>{formatIdr(order.subtotalIdr)}</span>
          </div>
          {order.discountIdr > 0 && (
            <div className="flex justify-between text-gray-400">
              <span>Diskon</span><span>-{formatIdr(order.discountIdr)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-white">
            <span>Total</span><span>{formatIdr(order.totalIdr)}</span>
          </div>
        </div>
      </div>

      {order.payment && (
        <div className="mt-4 rounded-xl2 border border-border bg-background-secondary/60 p-4 text-sm">
          <h3 className="mb-2 font-semibold">Pembayaran</h3>
          <p className="text-gray-400">Metode: {order.payment.method ?? "-"}</p>
          <p className="text-gray-400">Status: {order.payment.status}</p>

          {!isPaid &&
            order.payment.status === "PENDING" &&
            typeof order.payment.paymentReference === "string" &&
            (order.payment.paymentReference.startsWith("http://") || order.payment.paymentReference.startsWith("https://")) && (
              <a
                href={order.payment.paymentReference}
                className="mt-4 block rounded-xl bg-accent-blue px-4 py-3 text-center font-semibold text-white transition hover:opacity-90"
              >
                Bayar Sekarang
              </a>
            )}
        </div>
      )}

      {/* Kredensial akun HANYA ditampilkan setelah pembayaran terverifikasi sukses lewat webhook. */}
      {isPaid && (
        <div className="mt-4 space-y-3">
          {order.items
            .filter((item: any) => item.gameAccount)
            .map((item: any) => (
              <div key={item.id} className="rounded-xl2 border border-accent-blue/40 bg-accent-blue/5 p-4 text-sm">
                <h3 className="mb-2 font-semibold text-accent-blue">Kredensial: {item.product.name}</h3>
                <p className="text-gray-300">
                  Username/Email: <span className="font-mono">{decryptCredential(item.gameAccount!.usernameEmailEnc)}</span>
                </p>
                <p className="text-gray-300">
                  Password: <span className="font-mono">{decryptCredential(item.gameAccount!.passwordEnc)}</span>
                </p>
                {item.gameAccount!.recoveryDataEnc && (
                  <p className="mt-1 text-xs text-gray-500">
                    Info pemulihan tersedia — hubungi CS jika diperlukan.
                  </p>
                )}
              </div>
            ))}

          {order.topUpOrder && (
            <div className="rounded-xl2 border border-accent-blue/40 bg-accent-blue/5 p-4 text-sm">
              <h3 className="mb-1 font-semibold text-accent-blue">Status Top Up</h3>
              <p className="text-gray-300">{order.topUpOrder.status}</p>
            </div>
          )}
        </div>
      )}

      {!isPaid && order.status === "PENDING" && (
        <p className="mt-4 text-sm text-gray-400">
          Pembayaran belum diterima. Halaman ini akan otomatis menampilkan detail akun setelah pembayaran terkonfirmasi.
        </p>
      )}
    </div>
  );
}
