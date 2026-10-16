import { db } from "@/lib/db";
import { FaqAccordion } from "@/components/FaqAccordion";

export const metadata = { title: "FAQ" };

async function getSettings() {
  return db.settings.findFirst();
}

const DEFAULT_FAQ = [
  { topic: "Pembayaran", question: "Metode pembayaran apa saja yang didukung?", answer: "Pembayaran diproses otomatis lewat Midtrans, mendukung berbagai metode seperti transfer bank, e-wallet, dan QRIS sesuai yang diaktifkan pada akun merchant." },
  { topic: "Pembelian Akun", question: "Kapan saya menerima kredensial akun setelah membayar?", answer: "Kredensial akun akan tampil otomatis di halaman pesanan Anda setelah pembayaran terverifikasi oleh sistem." },
  { topic: "Top Up", question: "Berapa lama proses top up?", answer: "Top up diproses otomatis jika provider terhubung, atau diproses manual oleh admin dalam waktu yang wajar jika tidak." },
  { topic: "Garansi", question: "Apakah ada garansi untuk akun yang dibeli?", answer: "Kebijakan garansi mengikuti keterangan yang tercantum pada masing-masing produk." },
  { topic: "Refund", question: "Bagaimana proses refund?", answer: "Ajukan lewat halaman kontak, tim kami akan meninjau sesuai kebijakan refund yang berlaku." },
];

export default async function FaqPage() {
  await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-bold">Frequently Asked Questions</h1>
      <FaqAccordion items={DEFAULT_FAQ} />
    </div>
  );
}
