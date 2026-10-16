import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Notifikasi</h1>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada notifikasi.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`rounded-xl2 border p-4 ${
                n.isRead ? "border-border bg-background-secondary/40" : "border-accent-blue/40 bg-accent-blue/5"
              }`}
            >
              <p className="text-sm font-medium text-white">{n.title}</p>
              <p className="mt-1 text-sm text-gray-400">{n.message}</p>
              <p className="mt-2 text-xs text-gray-500">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
