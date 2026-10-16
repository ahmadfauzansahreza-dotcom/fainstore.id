import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";
import { decryptCredential } from "@/lib/crypto";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const account = await db.gameAccount.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  if (account.status === "SOLD") {
    return NextResponse.json({ error: "Akun yang sudah terjual tidak dapat dihapus." }, { status: 409 });
  }

  await db.gameAccount.delete({ where: { id } });
  await logAdminAction(admin.id, "GAME_ACCOUNT_DELETED", { accountId: id, productId: account.productId });

  return NextResponse.json({ status: "deleted" });
}

/**
 * POST /api/admin/accounts/[id]  → aksi "reveal"
 * Mendekripsi & menampilkan kredensial ke admin. Setiap pemanggilan WAJIB
 * tercatat di AdminLog (poin 57: "Account credentials accessed").
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const account = await db.gameAccount.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

  await logAdminAction(admin.id, "ACCOUNT_CREDENTIALS_ACCESSED", { accountId: id, productId: account.productId });

  return NextResponse.json({
    usernameEmail: decryptCredential(account.usernameEmailEnc),
    password: decryptCredential(account.passwordEnc),
    recoveryData: account.recoveryDataEnc ? decryptCredential(account.recoveryDataEnc) : null,
  });
}
