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

  getServiceStock(service: string): Promise<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>;

  createOrder(
    request: VIPaymentOrderRequest
  ): Promise<VIPaymentOrderResponse>;

  checkOrder(reference: string): Promise<VIPaymentOrderResponse>;

  getNickname(
    productCode: string,
    customerNo: string,
    serverNo?: string
  ): Promise<{
    success: boolean;
    nickname?: string;
    message?: string;
    data?: unknown;
  }>;
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

  async getServiceStock(service: string) {
    const result = await request({
      type: "service-stock",
      service,
    });

    return {
      success: Boolean(result?.result),
      data: result?.data,
      message: result?.message,
    };
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

    console.log(
      "[VIPAYMENT CREATE ORDER RESPONSE]",
      JSON.stringify(result, null, 2)
    );

    console.log(
      "[VIPAYMENT CREATE ORDER RESPONSE]",
      JSON.stringify(result, null, 2)
    );

    const trxid =
      typeof result?.data?.trxid === "string"
        ? result.data.trxid.trim()
        : "";

    return {
      success: Boolean(result?.result) && Boolean(trxid),
      reference: trxid || undefined,
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

    async getNickname(productCode, customerNo, serverNo) {
      const result = await request({
        type: "get-nickname",
        code: productCode,
        target: customerNo,
        ...(serverNo ? { additional_target: serverNo } : {}),
      });

      const data = Array.isArray(result?.data)
        ? result.data[0]
        : result?.data;

      return {
        success: Boolean(result?.result),
        nickname:
        typeof data === "string"
          ? data.replace(/^\x00/, "").trim()
          : data?.nickname || data?.name || data?.username || undefined,
        message: result?.message,
        data,
      };
    },

};
