/**
 * Abstraksi notifikasi. Implementasi aktual (nodemailer untuk email, HTTP call
 * untuk gateway WhatsApp) disambungkan lewat environment variables — tidak ada
 * kredensial yang di-hardcode di sini.
 */

export type NotificationEvent =
  | "ORDER_CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUCCESSFUL"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED";

interface NotifyParams {
  event: NotificationEvent;
  toEmail?: string;
  toWhatsApp?: string;
  orderNumber: string;
  message: string;
}

const EVENT_SUBJECTS: Record<NotificationEvent, string> = {
  ORDER_CREATED: "Pesanan Anda telah dibuat",
  PAYMENT_PENDING: "Menunggu Pembayaran",
  PAYMENT_SUCCESSFUL: "Pembayaran Berhasil",
  ORDER_COMPLETED: "Pesanan Selesai",
  ORDER_CANCELLED: "Pesanan Dibatalkan",
};

export async function sendEmailNotification(params: NotifyParams) {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.warn(`[notify] Kredensial SMTP belum diset — email untuk order ${params.orderNumber} tidak dikirim.`);
    return;
  }
  if (!params.toEmail) return;

  try {
    // Import dinamis supaya nodemailer tidak wajib ada di edge runtime bila tidak dipakai.
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_SERVER,
      port: Number(process.env.EMAIL_PORT ?? 587),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"FAIN STORE" <${process.env.EMAIL_USERNAME}>`,
      to: params.toEmail,
      subject: `${EVENT_SUBJECTS[params.event]} — ${params.orderNumber}`,
      text: params.message,
    });
  } catch (err) {
    // Kegagalan kirim notifikasi TIDAK BOLEH menggagalkan proses order/pembayaran.
    console.error(`[notify] Gagal mengirim email untuk order ${params.orderNumber}:`, err);
  }
}

export async function sendWhatsAppNotification(params: NotifyParams) {
  if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_NUMBER) {
    console.warn(`[notify] Kredensial WhatsApp Gateway belum diset — notifikasi order ${params.orderNumber} tidak dikirim.`);
    return;
  }

  // TODO: integrasikan HTTP call ke provider WhatsApp gateway Anda menggunakan
  // env WHATSAPP_API_KEY / WHATSAPP_NUMBER. Jangan hardcode endpoint/kredensial di sini.
}
