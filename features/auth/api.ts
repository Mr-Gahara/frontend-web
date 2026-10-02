/**
 * Pemanggilan endpoint autentikasi. Login memakai apiMentah, karena
 * accessToken dan requireSetup berada di tingkat atas respons dan akan
 * hilang bila envelope dibuka. Login pengguna (POST /pengguna/pin-login)
 * memakai token akun (authAkun).
 */
import { apiData, apiMentah } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { LoginResponse, PayloadLoginPengguna, ResponsLoginPengguna } from "@/types/auth";
import type { NilaiLoginAkun } from "./schema";

export const authApi = {
  loginAkun: (payload: NilaiLoginAkun) =>
    apiMentah.post<LoginResponse>(EP.akun.login, payload, "akun"),
  loginPengguna: (payload: PayloadLoginPengguna) =>
    apiMentah.post<ResponsLoginPengguna>(EP.pengguna.pinLogin, payload, "akun"),
  logoutAkun: () => apiData.post<unknown>(EP.akun.logout, {}, "akun"),
};