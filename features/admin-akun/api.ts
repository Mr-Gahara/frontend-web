import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { AkunAdmin, BuatAkunKlienPayload } from "@/types/adminAkun";

/** Seluruh endpoint admin memakai token akun (authAkun dan adminOnly di backend). */
export const adminAkunApi = {
  daftar: () => apiData.get<AkunAdmin[]>(EP.akun.adminDaftar, undefined, "akun"),
  buat: (payload: BuatAkunKlienPayload) =>
    apiData.post<AkunAdmin>(EP.akun.adminAkun, payload, "akun"),
};