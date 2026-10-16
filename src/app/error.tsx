"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-red-400">Terjadi Kesalahan</h1>
      <p className="mt-2 text-sm text-gray-400">
        Mohon maaf, terjadi kesalahan pada sistem kami. Silakan coba kembali.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Coba Lagi
      </button>
    </div>
  );
}
