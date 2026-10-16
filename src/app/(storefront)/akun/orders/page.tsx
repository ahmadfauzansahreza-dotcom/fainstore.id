import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatIdr } from "@/lib/money";

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id!;
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, payment: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400">Anda belum memiliki pesanan.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="block rounded-xl2 border border-border bg-background-secondary/60 p-4 hover:border-accent-blue/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{order.orderNumber}</span>
                <span className="text-sm text-gray-400">{order.status}</span>
              </div>
              <p className="mt-1 text-sm text-gray-300">
                {order.items.map((i: any) => i.product.name).join(", ")}
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                <span className="font-semibold text-white">{formatIdr(order.totalIdr)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
