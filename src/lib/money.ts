/**
 * Semua nilai uang disimpan & dihitung sebagai Int (Rupiah penuh, tanpa desimal).
 * JANGAN gunakan float untuk perhitungan harga.
 */

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function applyDiscount(
  priceIdr: number,
  discount: { type: "PERCENTAGE" | "FIXED"; percentage?: number | null; fixedAmountIdr?: number | null; maxDiscountIdr?: number | null }
): number {
  let discountAmount = 0;

  if (discount.type === "PERCENTAGE" && discount.percentage) {
    discountAmount = Math.floor((priceIdr * discount.percentage) / 100);
    if (discount.maxDiscountIdr) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountIdr);
    }
  } else if (discount.type === "FIXED" && discount.fixedAmountIdr) {
    discountAmount = discount.fixedAmountIdr;
  }

  return Math.max(priceIdr - discountAmount, 0);
}
