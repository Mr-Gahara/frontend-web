/**
 * Pemanggilan endpoint autentikasi. Login memakai apiMentah, karena
 * accessToken dan requireSetup berada di tingkat atas respons dan akan
 * hilang bila envelope dibuka. Login pengguna (POST /pengguna/pin-login)
 * memakai token akun (authAkun). Daftar akun (POST /akun/auth/register) tidak
 * memerlukan token; jenis token akun dipakai karena belum ada token apa pun,
 * sama seperti login akun. Begitu pula verifikasi email (B231, B232) dan lupa
 * password (B217): keempatnya publik, dan jawabannya sengaja seragam agar
 * daftar email tidak terbuka.
 */
import { apiData, apiMentah } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { LoginResponse, PayloadLoginPengguna, ResponsLoginPengguna } from "@/types/auth";
import type { NilaiLoginAkun } from "./schema";

/** Data langkah kirim OTP aksi Owner (B178, B180): email tersamar dan masa berlaku. */
export interface KirimanOtp {
  email: string;
  berlakuDetik: number;
}

export const authApi = {
  loginAkun: (payload: NilaiLoginAkun) =>
    apiMentah.post<LoginResponse>(EP.akun.login, payload, "akun"),
  daftarAkun: (payload: { email: string; password: string }) =>
    apiData.post<unknown>(EP.akun.register, payload, "akun"),
  verifikasiEmail: (payload: { email: string; otp: string; password: string }) =>
    apiData.post<unknown>(EP.akun.verifikasiEmail, payload, "akun"),
  kirimVerifikasiEmail: (email: string) =>
    apiData.post<unknown>(EP.akun.kirimVerifikasiEmail, { email }, "akun"),
  lupaPassword: (email: string) => apiData.post<unknown>(EP.akun.lupaPassword, { email }, "akun"),
  resetPassword: (payload: { email: string; otp: string; passwordBaru: string }) =>
    apiData.post<unknown>(EP.akun.resetPassword, payload, "akun"),
  loginPengguna: (payload: PayloadLoginPengguna) =>
    apiMentah.post<ResponsLoginPengguna>(EP.pengguna.pinLogin, payload, "akun"),
  /** Mengirim OTP ke email akun; menjawab email tersamar dan masa berlaku (B178). */
  kirimOtpResetPinOwner: () =>
    apiData.post<KirimanOtp>(EP.pengguna.resetPinOwnerOtp, {}, "akun"),
  resetPinOwner: (payload: { password: string; pinBaru: string; otp: string }) =>
    apiData.post<unknown>(EP.pengguna.resetPinOwner, payload, "akun"),
  logoutAkun: () => apiData.post<unknown>(EP.akun.logout, {}, "akun"),
  logoutPengguna: () => apiData.post<unknown>(EP.pengguna.pinLogout, {}, "pengguna"),
};