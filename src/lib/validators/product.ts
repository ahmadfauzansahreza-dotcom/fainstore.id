import { z } from "zod";

export const productQuerySchema = z.object({
  search: z.string().optional(),
  game: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["newest", "oldest", "cheapest", "expensive", "popular", "bestselling"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
});

export const createProductSchema = z.object({
  name: z.string().min(3),
  gameId: z.string(),
  categoryId: z.string().optional(),
  type: z.enum(["GAME_ACCOUNT", "TOPUP"]),
  description: z.string().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  priceIdr: z.number().int().positive(),
  originalPriceIdr: z.number().int().positive().optional(),
  discountPct: z.number().int().min(0).max(100).optional(),
  stockQty: z.number().int().min(0).default(0),
  warranty: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  images: z.array(z.string().url()).default([]),
});

export const updateProductSchema = createProductSchema.partial();
