import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatIdr } from "@/lib/money";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const orders = await db.order.findMany({
    where: { userId: session.user.id, status: { in: ["PROCESSING", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
    include: { invoice: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Invoice Saya</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada invoice yang tersedia.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl2 border border-border bg-background-secondary/60 p-4">
              <div>
                <p className="font-mono text-sm">{order.invoice?.invoiceNumber ?? `INV-${order.orderNumber}`}</p>
                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{formatIdr(order.totalIdr)}</span>
                <Link href={`/order/${order.id}`} className="text-xs text-accent-blue hover:underline">
                  Lihat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
