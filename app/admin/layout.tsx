"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminGuard } from "@/app/hooks/useAdminGuard";
import { Toaster } from "@/components/ui/sonner";
import { useLogoutAkun } from "@/features/auth/hooks";
import { KepalaAdmin } from "@/features/admin-akun/kepala-admin";
import { akhiriSesi } from "@/lib/auth/session";

/**
 * Layout panel admin (keputusan PA1a): ruang kerja akun admin platform,
 * terpisah dari dashboard toko. Kerangka desain B (pemilik proyek,
 * 24 November 2026): topbar navy dan isi berlatar gading dengan padding
 * yang sama dengan area gulir dashboard (16 px di HP). Memasang Toaster
 * sendiri, karena Toaster dashboard berada di dalam layout dashboard.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { siap } = useAdminGuard();
  const keluar = useLogoutAkun();

  // Sesi lokal tetap diakhiri walau permintaan logout gagal, sejalan
  // dengan "Keluar dari akun toko" di login pengguna.
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
      <div role="status" className="flex min-h-screen items-center justify-center bg-gading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Memuat panel admin</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gading text-navy">
      <KepalaAdmin onKeluar={logout} keluarBerjalan={keluar.isPending} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
