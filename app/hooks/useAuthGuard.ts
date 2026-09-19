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

export function useAuthGuard() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "keluar") router.replace("/login");
  }, [status, router]);

  return { status, siap: status === "masuk" };
}
