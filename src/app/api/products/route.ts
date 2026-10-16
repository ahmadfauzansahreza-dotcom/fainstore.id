import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/pg";

export const dynamic = "force-dynamic";

function toNumber(value: string | null, fallback?: number) {
  if (value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const search = params.get("search")?.trim() || "";
    const game = params.get("game")?.trim() || "";
    const category = params.get("category")?.trim() || "";

    const minPrice = toNumber(params.get("minPrice"));
    const maxPrice = toNumber(params.get("maxPrice"));

    const sort = params.get("sort") || "newest";
    const page = Math.max(1, toNumber(params.get("page"), 1) ?? 1);
    const pageSize = Math.min(
      100,
      Math.max(1, toNumber(params.get("pageSize"), 20) ?? 20)
    );

    const where: string[] = [
      `p."status" = true`,
      `p."deletedAt" IS NULL`,
    ];

    const values: unknown[] = [];

    if (game) {
      values.push(game);
      where.push(`g."slug" = $${values.length}`);
    }

    if (category) {
      values.push(category);
      where.push(`c."slug" = $${values.length}`);
    }

    if (minPrice !== undefined) {
      values.push(minPrice);
      where.push(`p."priceIdr" >= $${values.length}`);
    }

    if (maxPrice !== undefined) {
      values.push(maxPrice);
      where.push(`p."priceIdr" <= $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      const index = values.length;

      where.push(`
        (
          p."name" ILIKE $${index}
          OR p."slug" ILIKE $${index}
          OR COALESCE(p."description", '') ILIKE $${index}
          OR g."name" ILIKE $${index}
          OR c."name" ILIKE $${index}
        )
      `);
    }

    let orderBy = `p."createdAt" DESC`;

    switch (sort) {
      case "cheapest":
        orderBy = `p."priceIdr" ASC`;
        break;

      case "expensive":
        orderBy = `p."priceIdr" DESC`;
        break;

      case "oldest":
        orderBy = `p."createdAt" ASC`;
        break;

      case "bestselling":
      case "popular":
        orderBy = `p."soldCount" DESC, p."createdAt" DESC`;
        break;

      case "newest":
      default:
        orderBy = `p."createdAt" DESC`;
        break;
    }

    const whereSql = where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const offset = (page - 1) * pageSize;

    values.push(pageSize);
    const limitParam = values.length;

    values.push(offset);
    const offsetParam = values.length;

    const query = `
      SELECT
        p."id",
        p."name",
        p."slug",
        p."type",
        p."gameId",
        p."categoryId",
        p."description",
        p."specifications",
        p."priceIdr",
        p."originalPriceIdr",
        p."discountPct",
        p."stockQty",
        p."gameAccount",
        p."isFeatured",
        p."isBestSeller",
        p."isFlashSale",
        p."status",
        p."soldCount",
        p."warranty",
        p."isDemo",
        p."createdAt",
        p."updatedAt",
        p."deletedAt",

        json_build_object(
          'id', g."id",
          'name', g."name",
          'slug', g."slug",
          'imageUrl', g."imageUrl",
          'isActive', g."isActive",
          'createdAt', g."createdAt"
        ) AS "game",

        CASE
          WHEN c."id" IS NULL THEN NULL
          ELSE json_build_object(
            'id', c."id",
            'name', c."name",
            'slug', c."slug",
            'gameId', c."gameId",
            'createdAt', c."createdAt"
          )
        END AS "category",

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi."id",
                'productId', pi."productId",
                'url', pi."url",
                'position', pi."position"
              )
              ORDER BY pi."position" ASC
            )
            FROM "ProductImage" pi
            WHERE pi."productId" = p."id"
          ),
          '[]'::json
        ) AS "images",

        (
          SELECT COUNT(*)::int
          FROM "Review" r
          WHERE r."productId" = p."id"
        ) AS "reviewCount"

      FROM "Product" p

      INNER JOIN "Game" g
        ON g."id" = p."gameId"

      LEFT JOIN "Category" c
        ON c."id" = p."categoryId"

      ${whereSql}

      ORDER BY ${orderBy}

      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const countValues = values.slice(0, values.length - 2);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM "Product" p

      INNER JOIN "Game" g
        ON g."id" = p."gameId"

      LEFT JOIN "Category" c
        ON c."id" = p."categoryId"

      ${whereSql}
    `;

    const [itemsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const items = itemsResult.rows.map((item) => ({
      ...item,

      _count: {
        reviews: Number(item.reviewCount || 0),
      },
    }));

    const total = Number(countResult.rows[0]?.total || 0);

    const totalPages =
      pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        error: "Gagal mengambil data produk",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
