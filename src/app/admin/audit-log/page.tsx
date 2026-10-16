import { db } from "@/lib/db";

export default async function AuditLogPage() {
  const logs = await db.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Audit Log</h1>
      <div className="overflow-x-auto rounded-xl2 border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-secondary text-gray-400">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-3 text-gray-400">{new Date(log.createdAt).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{log.user.name ?? log.user.email}</td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3 text-gray-400">
                  <code className="text-xs">{log.detail ? JSON.stringify(log.detail) : "-"}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-4 text-sm text-gray-500">Belum ada aktivitas tercatat.</p>}
      </div>
    </div>
  );
}
