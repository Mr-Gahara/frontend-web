"use client";

import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { useAdminGuard } from "@/app/hooks/useAdminGuard";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useLogoutAkun } from "@/features/auth/hooks";
import { akhiriSesi } from "@/lib/auth/session";

/**
 * Layout panel admin (keputusan PA1a): ruang kerja akun admin platform,
 * terpisah dari dashboard toko. Memasang Toaster sendiri, karena Toaster
 * dashboard berada di dalam layout dashboard.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { siap } = useAdminGuard();
  const keluar = useLogoutAkun();

  // Sesi lokal tetap diakhiri walau permintaan logout gagal, sejalan
  // dengan "Ganti Akun Bisnis" di login pengguna.
  const logout = () => {
    keluar.mutate(undefined, {
      onSettled: () => {
        akhiriSesi();
        router.push("/login");
      },
    });
  };

  if (!siap) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Memuat panel admin</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="text-lg font-semibold">Panel Admin Tachyon POS</p>
        <Button variant="outline" size="sm" onClick={logout} disabled={keluar.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </header>
      <main className="p-6">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}