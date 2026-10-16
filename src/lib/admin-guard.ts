import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return null;
  }
  return session.user as { id: string; role: string; email: string };
}

export async function logAdminAction(userId: string, action: string, detail?: Record<string, unknown>) {
  await db.adminLog.create({ data: { userId, action, detail: detail as never } });
}
