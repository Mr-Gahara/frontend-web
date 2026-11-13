/**
 * Aksi Owner atas akun tokonya sendiri, bertoken pengguna dan berizin
 * update-akun; backend menolak selain Owner (B179 sampai B181). Akun yang
 * diubah selalu akun tenant di sesi: backend tidak memakai :id di
 * PUT /akun/profil/update/:id, tetapi web tetap mengirim id akun dari
 * GET /akun/me sesuai kontraknya.
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { KirimanOtp } from "@/features/auth/api";

/** Tujuan OTP akun (B180); kode satu tujuan tidak berlaku untuk tujuan lain. */
export type TujuanOtpAkun = "ubah-profil" | "hapus-akun";

export const akunTokoApi = {
  kirimOtp: (tujuan: TujuanOtpAkun) => apiData.post<KirimanOtp>(EP.akun.profilOtp, { tujuan }),
  ubahEmail: (id: string, payload: { email: string; otp: string }) =>
    apiData.put<unknown>(EP.akun.profilUbah(id), payload),
  ubahPassword: (id: string, payload: { oldPassword: string; password: string; otp: string }) =>
    apiData.put<unknown>(EP.akun.profilUbah(id), payload),
};
