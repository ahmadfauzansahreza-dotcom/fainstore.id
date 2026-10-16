import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageTransition } from "@/components/layout/PageTransition";

export const dynamic = "force-dynamic";

const getMaintenanceMode = unstable_cache(
  async () => {
    const settings = await db.settings.findFirst({
      select: { maintenanceMode: true },
    });

    return settings?.maintenanceMode ?? false;
  },
  ["fain-store-maintenance-mode"],
  {
    revalidate: 10,
  }
);

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenanceMode = await getMaintenanceMode();

  if (maintenanceMode) {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

    if (!isAdmin) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-brand bg-clip-text text-transparent">FAIN</span> STORE
          </h1>
          <p className="mt-4 text-gray-400">Situs sedang dalam pemeliharaan. Kami akan segera kembali.</p>
        </div>
      );
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
