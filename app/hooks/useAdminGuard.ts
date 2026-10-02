"use client";

/**
 * Guard sesi untuk panel admin (keputusan PA1a). Menunggu pemulihan sesi
 * selesai, lalu mengalihkan selain akun admin: tanpa token akun ke login,
 * akun klien ke dashboard atau login pengguna.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { tujuanGuardAdmin } from "@/lib/auth/tujuan";

export function useAdminGuard() {
  const router = useRouter();
  const { status, adaTokenAkun, adalahAdmin } = useSession();

  useEffect(() => {
    const tujuan = tujuanGuardAdmin({ status, adaTokenAkun, adalahAdmin });
    if (tujuan) router.replace(tujuan);
  }, [status, adaTokenAkun, adalahAdmin, router]);

  return { siap: status !== "memuat" && adaTokenAkun && adalahAdmin };
}