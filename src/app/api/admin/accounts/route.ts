import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";
import { encryptCredential } from "@/lib/crypto";

const createSchema = z.object({
  productId: z.string(),
  loginMethod: z.string().optional(),
  usernameEmail: z.string().min(1),
  password: z.string().min(1),
  recoveryData: z.string().optional(),
});

/**
 * GET /api/admin/accounts?productId=...
 * Mengembalikan daftar akun untuk produk tertentu. Kredensial TIDAK didekripsi
 * di listing — hanya status & metadata, supaya tidak bocor lewat network log dsb.
 * Dekripsi hanya terjadi satu-per-satu lewat endpoint reveal khusus dengan audit log.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId wajib diisi." }, { status: 400 });

  const accounts = await db.gameAccount.findMany({
    where: { productId },
    select: {
      id: true,
      loginMethod: true,
      status: true,
      reservedUntil: true,
      soldAt: true,
      createdAt: true,
      // usernameEmailEnc / passwordEnc / recoveryDataEnc SENGAJA tidak di-select di sini.
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: accounts });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Data akun tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const product = await db.product.findUnique({ where: { id: input.productId } });
  if (!product || product.type !== "GAME_ACCOUNT") {
    return NextResponse.json({ error: "Produk tidak ditemukan atau bukan tipe akun game." }, { status: 404 });
  }

  const account = await db.gameAccount.create({
    data: {
      productId: input.productId,
      loginMethod: input.loginMethod,
      usernameEmailEnc: encryptCredential(input.usernameEmail),
      passwordEnc: encryptCredential(input.password),
      recoveryDataEnc: input.recoveryData ? encryptCredential(input.recoveryData) : null,
      status: "AVAILABLE",
    },
    select: { id: true, status: true, createdAt: true },
  });

  // Audit log TIDAK menyimpan kredensial mentah, hanya metadata bahwa penambahan terjadi.
  await logAdminAction(admin.id, "GAME_ACCOUNT_ADDED", { productId: input.productId, accountId: account.id });

  return NextResponse.json(account, { status: 201 });
}
