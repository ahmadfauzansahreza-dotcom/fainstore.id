import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatIdr } from "@/lib/money";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date = new Date()) {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfSevenDays(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - 6);
  return d;
}

async function getDashboardData() {
  const now = new Date();
  const today = startOfDay(now);
  const month = startOfMonth(now);
  const year = startOfYear(now);
  const sevenDays = startOfSevenDays(now);

  try {
    const [
      todayOrders,
      todayRevenue,
      monthRevenue,
      yearRevenue,
      pendingPayments,
      processingOrders,
      completedOrders,
      cancelledOrders,
      availableAccounts,
      soldAccounts,
      customers,
      recentOrders,
      weeklyOrders,
    ] = await Promise.all([
      db.order.count({
        where: {
          createdAt: { gte: today },
          status: { in: ["PROCESSING", "COMPLETED"] },
        },
      }),

      db.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { in: ["PROCESSING", "COMPLETED"] },
        },
        _sum: {
          totalIdr: true,
        },
      }),

      db.order.aggregate({
        where: {
          createdAt: { gte: month },
          status: { in: ["PROCESSING", "COMPLETED"] },
        },
        _sum: {
          totalIdr: true,
        },
      }),

      db.order.aggregate({
        where: {
          createdAt: { gte: year },
          status: { in: ["PROCESSING", "COMPLETED"] },
        },
        _sum: {
          totalIdr: true,
        },
      }),

      db.payment.count({
        where: {
          status: "PENDING",
        },
      }),

      db.order.count({
        where: {
          status: "PROCESSING",
        },
      }),

      db.order.count({
        where: {
          status: "COMPLETED",
        },
      }),

      db.order.count({
        where: {
          status: "CANCELLED",
        },
      }),

      db.gameAccount.count({
        where: {
          status: "AVAILABLE",
        },
      }),

      db.gameAccount.count({
        where: {
          status: "SOLD",
        },
      }),

      db.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),

      db.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          totalIdr: true,
          status: true,
          createdAt: true,
        },
      }),

      db.order.findMany({
        where: {
          createdAt: {
            gte: sevenDays,
          },
          status: {
            in: ["PROCESSING", "COMPLETED"],
          },
        },
        select: {
          totalIdr: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      todayOrders,
      todayRevenue: todayRevenue._sum.totalIdr ?? 0,
      monthRevenue: monthRevenue._sum.totalIdr ?? 0,
      yearRevenue: yearRevenue._sum.totalIdr ?? 0,
      pendingPayments,
      processingOrders,
      completedOrders,
      cancelledOrders,
      availableAccounts,
      soldAccounts,
      customers,
      recentOrders,
      weeklyOrders,
    };
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return {
      todayOrders: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      yearRevenue: 0,
      pendingPayments: 0,
      processingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      availableAccounts: 0,
      soldAccounts: 0,
      customers: 0,
      recentOrders: [],
      weeklyOrders: [],
    };
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Selesai";
    case "PROCESSING":
      return "Diproses";
    case "CANCELLED":
      return "Dibatalkan";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "PROCESSING":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    case "CANCELLED":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function buildWeeklyChart(
  orders: { totalIdr: number; createdAt: Date }[],
) {
  const result: { label: string; value: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const value = orders
      .filter((order) => {
        const created = new Date(order.createdAt);
        return created >= date && created < next;
      })
      .reduce((sum, order) => sum + order.totalIdr, 0);

    result.push({
      label: new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
      }).format(date),
      value,
    });
  }

  return result;
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const chart = buildWeeklyChart(data.weeklyOrders);

  const maxChartValue = Math.max(...chart.map((item) => item.value), 1);

  return (
    <main className="min-w-0 space-y-6 pb-10">
      {/* HEADER */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              FAIN STORE
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Dashboard Admin
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Pantau performa toko dan transaksi secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
            <RefreshCw className="h-4 w-4 text-gray-500" />
            {new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </div>
        </div>
      </section>

      {/* REVENUE */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Omzet & Pendapatan
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ringkasan transaksi yang berhasil diproses.
            </p>
          </div>

          <TrendingUp className="hidden h-5 w-5 text-gray-500 sm:block" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <CreditCard className="h-5 w-5 text-gray-300" />
              </div>

              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </div>

            <p className="text-sm text-gray-400">Omzet Hari Ini</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatIdr(data.todayRevenue)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {data.todayOrders} pesanan hari ini
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <TrendingUp className="h-5 w-5 text-gray-300" />
              </div>

              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </div>

            <p className="text-sm text-gray-400">Omzet Bulan Ini</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatIdr(data.monthRevenue)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Transaksi berhasil bulan ini
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <TrendingUp className="h-5 w-5 text-gray-300" />
              </div>

              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </div>

            <p className="text-sm text-gray-400">Omzet Tahun Ini</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatIdr(data.yearRevenue)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Transaksi berhasil tahun ini
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <ShoppingCart className="h-5 w-5 text-gray-300" />
              </div>

              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </div>

            <p className="text-sm text-gray-400">Pesanan Hari Ini</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {data.todayOrders}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Pesanan masuk hari ini
            </p>
          </div>
        </div>
      </section>

      {/* TRANSACTION MONITOR */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">
            Monitoring Transaksi
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Status pesanan dan pembayaran saat ini.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Clock3 className="mb-5 h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-400">Pembayaran Pending</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {data.pendingPayments}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <RefreshCw className="mb-5 h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-400">Sedang Diproses</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {data.processingOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <CheckCircle2 className="mb-5 h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-400">Pesanan Selesai</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {data.completedOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <XCircle className="mb-5 h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-400">Pesanan Dibatalkan</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {data.cancelledOrders}
            </p>
          </div>
        </div>
      </section>

      {/* SALES CHART */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">
            Performa Penjualan
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Omzet 7 hari terakhir.
          </p>
        </div>

        <div className="flex h-64 items-end gap-2 sm:gap-4">
          {chart.map((item) => {
            const height =
              item.value === 0
                ? 4
                : Math.max((item.value / maxChartValue) * 100, 8);

            return (
              <div
                key={item.label}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <div className="mb-2 text-center text-[10px] text-gray-500">
                  {item.value > 0 ? formatIdr(item.value) : ""}
                </div>

                <div
                  className="w-full rounded-t-xl border border-white/10 bg-white/10 transition-all"
                  style={{ height: `${height}%` }}
                />

                <p className="mt-3 text-center text-xs text-gray-500">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* STORE DATA */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Data Toko</h2>
          <p className="mt-1 text-sm text-gray-500">
            Kondisi katalog dan customer.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <Box className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  Akun Tersedia
                </p>
                <p className="text-xs text-gray-500">Stok akun aktif</p>
              </div>
            </div>

            <p className="text-xl font-bold text-white">
              {data.availableAccounts}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Akun Terjual</p>
                <p className="text-xs text-gray-500">Total akun terjual</p>
              </div>
            </div>

            <p className="text-xl font-bold text-white">
              {data.soldAccounts}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Customer</p>
                <p className="text-xs text-gray-500">Customer terdaftar</p>
              </div>
            </div>

            <p className="text-xl font-bold text-white">
              {data.customers}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Total Inventaris</p>
                <p className="text-xs text-gray-500">Akun tersedia + terjual</p>
              </div>
            </div>

            <p className="text-xl font-bold text-white">
              {data.availableAccounts + data.soldAccounts}
            </p>
          </div>
        </div>
      </section>

      {/* RECENT ORDERS */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              Transaksi Terbaru
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pesanan terbaru yang masuk ke sistem.
            </p>
          </div>

          <a
            href="/admin/orders"
            className="text-sm font-medium text-gray-300 transition hover:text-white"
          >
            Lihat semua
          </a>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-500">
              Belum ada transaksi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    #{order.id}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="text-sm font-semibold text-white">
                    {formatIdr(order.totalIdr)}
                  </p>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                      order.status,
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* QUICK ACCESS */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Akses Cepat</h2>
          <p className="mt-1 text-sm text-gray-500">
            Kelola bagian penting toko.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <a
            href="/admin/products"
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Package className="mb-5 h-5 w-5 text-gray-300" />
            <p className="font-semibold text-white">Kelola Produk</p>
            <p className="mt-1 text-sm text-gray-500">
              Tambah dan ubah katalog.
            </p>
          </a>

          <a
            href="/admin/orders"
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <ShoppingCart className="mb-5 h-5 w-5 text-gray-300" />
            <p className="font-semibold text-white">Kelola Pesanan</p>
            <p className="mt-1 text-sm text-gray-500">
              Pantau seluruh transaksi.
            </p>
          </a>

          <a
            href="/admin/accounts"
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Box className="mb-5 h-5 w-5 text-gray-300" />
            <p className="font-semibold text-white">Inventaris Akun</p>
            <p className="mt-1 text-sm text-gray-500">
              Kelola stok akun game.
            </p>
          </a>

          <a
            href="/admin/settings"
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <CreditCard className="mb-5 h-5 w-5 text-gray-300" />
            <p className="font-semibold text-white">Pengaturan</p>
            <p className="mt-1 text-sm text-gray-500">
              Konfigurasi toko.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
