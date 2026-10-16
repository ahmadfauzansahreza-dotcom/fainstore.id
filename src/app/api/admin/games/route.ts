import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-guard";

const schema = z.object({ name: z.string().min(1), imageUrl: z.string().url().optional() });

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data game tidak valid." }, { status: 400 });

  const slug = slugify(parsed.data.name);
  const existing = await db.game.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Game dengan nama serupa sudah ada." }, { status: 409 });

  const game = await db.game.create({ data: { name: parsed.data.name, slug, imageUrl: parsed.data.imageUrl } });
  await logAdminAction(admin.id, "GAME_CREATED", { gameId: game.id });

  return NextResponse.json(game, { status: 201 });
}
