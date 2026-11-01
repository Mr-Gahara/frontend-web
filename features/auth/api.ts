/**
 * Pemanggilan endpoint autentikasi. Login memakai apiMentah, karena
 * accessToken dan requireSetup berada di tingkat atas respons dan akan
 * hilang bila envelope dibuka. Login pengguna (POST /pengguna/pin-login)
 * memakai token akun (authAkun). Daftar akun (POST /akun/auth/register) tidak
 * memerlukan token; jenis token akun dipakai karena belum ada token apa pun,
 * sama seperti login akun.
 */
import { apiData, apiMentah } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { LoginResponse, PayloadLoginPengguna, ResponsLoginPengguna } from "@/types/auth";
import type { NilaiLoginAkun } from "./schema";

export const authApi = {
  loginAkun: (payload: NilaiLoginAkun) =>
    apiMentah.post<LoginResponse>(EP.akun.login, payload, "akun"),
  daftarAkun: (payload: { email: string; password: string }) =>
    apiData.post<unknown>(EP.akun.register, payload, "akun"),
  loginPengguna: (payload: PayloadLoginPengguna) =>
    apiMentah.post<ResponsLoginPengguna>(EP.pengguna.pinLogin, payload, "akun"),
  logoutAkun: () => apiData.post<unknown>(EP.akun.logout, {}, "akun"),
  logoutPengguna: () => apiData.post<unknown>(EP.pengguna.pinLogout, {}, "pengguna"),
};