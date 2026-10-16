import { db } from "@/lib/db";
import { MessageCircle, Mail, Instagram } from "lucide-react";

export const metadata = { title: "Kontak" };

export default async function ContactPage() {
  const settings = await db.settings.findFirst();

  const channels = [
    settings?.whatsappNumber && { icon: MessageCircle, label: "WhatsApp", value: settings.whatsappNumber, href: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}` },
    settings?.email && { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings?.instagram && { icon: Instagram, label: "Instagram", value: settings.instagram, href: `https://instagram.com/${settings.instagram.replace("@", "")}` },
  ].filter(Boolean) as { icon: typeof MessageCircle; label: string; value: string; href: string }[];

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-xl font-bold">Hubungi Kami</h1>
      {channels.length === 0 ? (
        <p className="text-sm text-gray-500">Informasi kontak belum diatur oleh admin.</p>
      ) : (
        <div className="space-y-2">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl2 border border-border bg-background-secondary/60 p-4 hover:border-accent-blue/40"
            >
              <c.icon className="h-5 w-5 text-accent-blue" />
              <div>
                <p className="text-sm font-medium text-white">{c.label}</p>
                <p className="text-xs text-gray-400">{c.value}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
