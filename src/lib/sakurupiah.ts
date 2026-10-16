import crypto from "crypto";

const API_ID = process.env.SAKURUPIAH_API_ID!;
const API_KEY = process.env.SAKURUPIAH_API_KEY!;

const BASE_URL =
  process.env.SAKURUPIAH_IS_PRODUCTION === "true"
    ? "https://sakurupiah.id/api/"
    : "https://sakurupiah.id/api-sanbox/";

export function generateSakurupiahSignature(
  method: string,
  merchantRef: string,
  amount: number
) {
  return crypto
    .createHmac("sha256", API_KEY)
    .update(`${API_ID}${method}${merchantRef}${amount}`)
    .digest("hex");
}

export async function createSakurupiahInvoice(params: {
  method: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  merchantRef: string;
  callbackUrl: string;
  returnUrl: string;
}) {
  const form = new URLSearchParams({
    api_id: API_ID,
    method: params.method,
    name: params.name,
    email: params.email,
    phone: params.phone,
    amount: String(params.amount),
    merchant_fee: "1",
    merchant_ref: params.merchantRef,
    callback_url: params.callbackUrl,
    return_url: params.returnUrl,
    signature: generateSakurupiahSignature(
      params.method,
      params.merchantRef,
      params.amount
    ),
  });

  const response = await fetch(`${BASE_URL}create.php`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Sakurupiah ${response.status}: ${text}`);
  }

  return JSON.parse(text);
}

export function verifySakurupiahSignature(body: Record<string, unknown>) {
  const data =
    body.data && typeof body.data === "object" && body.data !== null
      ? (body.data as Record<string, unknown>)
      : {};

  const method = String(body.method ?? data.method ?? "");
  const merchantRef = String(
    body.merchant_ref ?? data.merchant_ref ?? ""
  );
  const amount = Number(
    body.amount ?? data.amount ?? 0
  );
  const received = String(
    body.signature ?? data.signature ?? ""
  );

  if (!method || !merchantRef || !amount || !received) {
    return false;
  }

  const expected = generateSakurupiahSignature(
    method,
    merchantRef,
    amount
  );

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(received),
    Buffer.from(expected)
  );
}
