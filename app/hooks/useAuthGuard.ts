"use client";

/**
 * Guard sesi untuk halaman dashboard.
 *
 * Token kini hanya hidup di memori dan dipulihkan lewat cookie refresh
 * saat aplikasi dimuat (components/providers/session-provider.tsx).
 * Karena itu guard wajib menunggu status pemulihan selesai; bila tidak,
 * setiap reload akan melempar pengguna ke halaman login.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { tujuanGuardDashboard } from "@/lib/auth/tujuan";

export function useAuthGuard() {
  const router = useRouter();
  const { status, adaTokenAkun, adalahAdmin } = useSession();

  useEffect(() => {
    // Sesi pengguna berakhir tetapi token akun masih ada (misalnya setelah
    // PIN diubah, keputusan PF7a): cukup login PIN ulang, sejalan dengan
    // lib/apiClient.ts saat pin-refresh gagal. Akun admin tidak punya
    // pengguna dan dikembalikan ke panel admin (keputusan PA1a).
    const tujuan = tujuanGuardDashboard({ status, adaTokenAkun, adalahAdmin });
    if (tujuan) router.replace(tujuan);
  }, [status, adaTokenAkun, adalahAdmin, router]);

  return { status, siap: status === "masuk" };
}
