"use client";

import { useEffect, useState } from "react";
import { formatIdr } from "@/lib/money";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalIdr: number;
  status: string;
  createdAt: string;
  payment: { status: string } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Manajemen Pesanan</h1>
      {loading ? (
        <p className="text-sm text-gray-400">Memuat...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-secondary text-gray-400">
              <tr>
                <th className="px-4 py-3">No. Pesanan</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status Order</th>
                <th className="px-4 py-3">Status Bayar</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">{formatIdr(o.totalIdr)}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{o.payment?.status ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="p-4 text-sm text-gray-500">Belum ada pesanan.</p>}
        </div>
      )}
      <p className="mt-3 text-xs text-gray-500">
        Status pembayaran hanya berubah otomatis lewat webhook Midtrans terverifikasi — tidak bisa diubah manual dari sini.
      </p>
    </div>
  );
}
