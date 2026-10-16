import crypto from "node:crypto";

const API_ID = process.env.VIPAYMENT_API_ID;
const API_KEY = process.env.VIPAYMENT_API_KEY;
const BASE_URL =
  process.env.VIPAYMENT_BASE_URL ||
  "https://vip-reseller.co.id/api/game-feature";

function getSignature() {
  if (!API_ID || !API_KEY) {
    throw new Error(
      "VIPayment credential belum dikonfigurasi: VIPAYMENT_API_ID / VIPAYMENT_API_KEY"
    );
  }

  return crypto
    .createHash("md5")
    .update(API_ID + API_KEY)
    .digest("hex");
}

async function request(payload: Record<string, unknown>) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      key: API_KEY || "",
      sign: getSignature(),
      ...Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [
          key,
          String(value ?? ""),
        ])
      ),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `VIPayment HTTP ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

export interface VIPaymentProduct {
  code: string;
  game: string;
  name: string;
  description?: string;
  price?: {
    basic?: number;
    premium?: number;
    special?: number;
  };
  server?: string;
  status?: string;
}

export interface VIPaymentOrderRequest {
  reference: string;
  productCode: string;
  customerNo: string;
  serverNo?: string;
  additionalData?: string;
}

export interface VIPaymentOrderResponse {
  success: boolean;
  reference?: string;
  status?: string;
  message?: string;
  data?: unknown;
}

export interface VIPaymentProvider {
  name: "vipayment";

  getProducts(
    game?: string,
    status?: "available" | "empty"
  ): Promise<VIPaymentProduct[]>;

  createOrder(
    request: VIPaymentOrderRequest
  ): Promise<VIPaymentOrderResponse>;

  checkOrder(reference: string): Promise<VIPaymentOrderResponse>;
}

export const vipaymentProvider: VIPaymentProvider = {
  name: "vipayment",

  async getProducts(game, status) {
    const result = await request({
      type: "services",
      ...(game ? { filter_game: game } : {}),
      ...(status ? { filter_status: status } : {}),
    });

    if (!result?.result) {
      throw new Error(
        result?.message || "Gagal mengambil produk VIPayment"
      );
    }

    return Array.isArray(result.data) ? result.data : [];
  },

  async createOrder({
    reference,
    productCode,
    customerNo,
    serverNo,
    additionalData,
  }) {
    const result = await request({
      type: "order",
      service: productCode,
      data_no: customerNo,
      ...(serverNo ? { data_zone: serverNo } : {}),
      ...(additionalData
        ? { post_additional_data: additionalData }
        : {}),
    });

    return {
      success: Boolean(result?.result),
      reference: result?.data?.trxid || reference,
      status: result?.data?.status,
      message: result?.message,
      data: result?.data,
    };
  },

  async checkOrder(reference) {
    const result = await request({
      type: "status",
      trxid: reference,
    });

    const data = Array.isArray(result?.data)
      ? result.data[0]
      : result?.data;

    return {
      success: Boolean(result?.result),
      reference: data?.trxid || reference,
      status: data?.status,
      message: result?.message,
      data,
    };
  },
};
