const STEPS = [
  { title: "Pilih Produk", desc: "Cari akun game atau top up yang Anda inginkan, lalu buka halaman detail produk." },
  { title: "Tambah ke Keranjang", desc: "Klik \"Beli Sekarang\" atau tambahkan ke keranjang, lalu lanjutkan ke checkout." },
  { title: "Isi Data Pemesanan", desc: "Masukkan nama, email, dan nomor WhatsApp aktif untuk keperluan notifikasi pesanan." },
  { title: "Bayar Otomatis", desc: "Pilih metode pembayaran lewat Midtrans (transfer bank, e-wallet, QRIS, dll) dan selesaikan pembayaran." },
  { title: "Terima Pesanan", desc: "Setelah pembayaran terverifikasi, kredensial akun atau status top up akan otomatis tampil di halaman pesanan Anda." },
];

export const metadata = { title: "Cara Order" };

export default function CaraOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-bold">Cara Order</h1>
      <ol className="space-y-4">
        {STEPS.map((step, idx) => (
          <li key={step.title} className="flex gap-4 rounded-xl2 border border-border bg-background-secondary/60 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
              {idx + 1}
            </span>
            <div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
