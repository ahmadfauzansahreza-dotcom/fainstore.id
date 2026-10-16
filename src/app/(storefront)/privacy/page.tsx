import { db } from "@/lib/db";

export const metadata = { title: "Kebijakan Privasi" };

export default async function PrivacyPage() {
  const settings = await db.settings.findFirst();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-bold">Kebijakan Privasi</h1>
      <div className="whitespace-pre-line text-sm leading-relaxed text-gray-300">
        {settings?.privacyContent ?? "Konten kebijakan privasi belum diatur oleh admin."}
      </div>
    </div>
  );
}
