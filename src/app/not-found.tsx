import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-accent-blue">404</h1>
      <p className="mt-2 text-gray-400">Halaman yang Anda cari tidak ditemukan.</p>
      <Link href="/" className="mt-6 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
