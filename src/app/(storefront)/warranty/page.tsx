import { db } from "@/lib/db";

export const metadata = { title: "Garansi" };

export default async function WarrantyPage() {
  const settings = await db.settings.findFirst();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-bold">Kebijakan Garansi</h1>
      <div className="whitespace-pre-line text-sm leading-relaxed text-gray-300">
        {settings?.warrantyPolicy ?? "Kebijakan garansi belum diatur oleh admin. Garansi masing-masing produk tercantum pada halaman detail produk."}
      </div>
    </div>
  );
}
