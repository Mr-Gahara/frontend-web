"use client";

/**
 * Hook pembaca sesi.
 *
 * Menggantikan pembacaan sessionStorage dan pendekodean JWT yang
 * sebelumnya tersebar di 14 komponen.
 */

import { useSyncExternalStore } from "react";
import { bacaSesi, langgananSesi, punyaIzin, punyaSalahSatuIzin } from "./session";

const snapshotServer = {
  tokenAkun: null,
  akun: null,
  tokenPengguna: null,
  pengguna: null,
  status: "memuat" as const,
};

export function useSession() {
  const sesi = useSyncExternalStore(langgananSesi, bacaSesi, () => snapshotServer);

  return {
    /** Token akun diperlukan halaman login PIN untuk memanggil pin-login. */
    adaTokenAkun: !!sesi.tokenAkun,
    /** Akun admin platform tidak punya pengguna; ruang kerjanya /admin (keputusan PA1a). */
    akun: sesi.akun,
    adalahAdmin: sesi.akun?.role === "admin",
    pengguna: sesi.pengguna,
    permissions: sesi.pengguna?.permissions ?? [],
    role: sesi.pengguna?.role ?? "",
    status: sesi.status,
    sudahMasuk: sesi.status === "masuk",
    sedangMemuat: sesi.status === "memuat",
    punyaIzin,
    punyaSalahSatuIzin,
  };
}