import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

if (!MIDTRANS_SERVER_KEY) {
  // Sengaja throw saat boot, bukan saat request, supaya kesalahan konfigurasi ketahuan lebih awal.
  console.warn("MIDTRANS_SERVER_KEY belum diset di environment variables.");
}

const SNAP_BASE_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

function authHeader() {
  const encoded = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}

interface CreateSnapTransactionParams {
  orderId: string; // ID unik internal, dipakai sebagai order_id Midtrans
  grossAmountIdr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
}

export async function createSnapTransaction(params: CreateSnapTransactionParams) {
  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmountIdr,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
    item_details: params.itemDetails,
  };

  const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gagal membuat transaksi Midtrans: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<{ token: string; redirect_url: string }>;
}

/**
 * Memverifikasi signature_key yang dikirim Midtrans pada payload webhook.
 * Rumus resmi Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  if (!MIDTRANS_SERVER_KEY) return false;

  const expected = crypto
    .createHash("sha512")
    .update(params.orderId + params.statusCode + params.grossAmount + MIDTRANS_SERVER_KEY)
    .digest("hex");

  // Perbandingan waktu-konstan untuk mencegah timing attack.
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(params.signatureKey);

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Menormalkan transaction_status + fraud_status Midtrans menjadi status internal aplikasi.
 * JANGAN pernah percaya status yang dikirim langsung dari frontend.
 */
export function normalizePaymentStatus(
  transactionStatus: string,
  fraudStatus?: string
): "PENDING" | "SETTLEMENT" | "CAPTURE" | "PAID" | "EXPIRE" | "CANCEL" | "DENY" | "REFUND" | "PARTIAL_REFUND" | "FAILED" {
  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "challenge") return "PENDING";
      if (fraudStatus === "accept") return "CAPTURE";
      return "PENDING";
    case "settlement":
      return "SETTLEMENT";
    case "pending":
      return "PENDING";
    case "deny":
      return "DENY";
    case "cancel":
      return "CANCEL";
    case "expire":
      return "EXPIRE";
    case "refund":
      return "REFUND";
    case "partial_refund":
      return "PARTIAL_REFUND";
    default:
      return "FAILED";
  }
}

export const SUCCESSFUL_PAYMENT_STATUSES = new Set(["SETTLEMENT", "CAPTURE", "PAID"]);
