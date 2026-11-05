import { apiData, apiMentah } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { StatusSetup } from "./status";

/** data POST /tenant: accessToken akun baru yang sudah membawa tenantID. */
interface ResponsBuatToko {
  accessToken: string;
}

/** Respons POST /pengguna/register-owner: accessToken pengguna (loginType web) di tingkat atas (B219). */
interface ResponsOwner {
  accessToken?: string;
  data?: { pengguna?: { nama?: string } };
}

/**
 * Langkah awal setup berjalan sebelum Owner ada, sehingga status, buat toko,
 * dan daftar Owner memakai token akun.
 */
export const setupApi = {
  status: () => apiData.get<StatusSetup>(EP.setup.status, undefined, "akun"),
  buatToko: (namaToko: string) => apiData.post<ResponsBuatToko>(EP.tenant.list, { namaToko }, "akun"),
  /** Tanpa installationId dan aksesType: backend memberi Owner akses web dan app (SA6a, B219). */
  daftarOwner: (nama: string, pin: string) =>
    apiMentah.post<ResponsOwner>(EP.pengguna.registerOwner, { nama, pin }, "akun"),
};
