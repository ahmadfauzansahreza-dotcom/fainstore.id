"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full items-center gap-3 rounded-xl2 border border-border bg-background-secondary/60 px-4 py-3 text-left text-sm text-red-400 hover:border-red-400/40"
    >
      <LogOut className="h-4 w-4" /> Keluar
    </button>
  );
}
