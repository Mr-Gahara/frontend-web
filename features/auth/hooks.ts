"use client";

/**
 * Hook autentikasi. Hanya memanggil API; penyimpanan token dan pengalihan
 * halaman diurus pemanggilnya lewat callback mutate, karena keduanya
 * bergantung pada isi respons.
 */
import { useMutation } from "@tanstack/react-query";
import { authApi } from "./api";
import type { NilaiLoginAkun, NilaiLoginPengguna } from "./schema";

export function useLoginAkun() {
  return useMutation({
    mutationFn: (nilai: NilaiLoginAkun) => authApi.loginAkun(nilai),
  });
}

export function useLoginPengguna() {
  return useMutation({
    mutationFn: (nilai: NilaiLoginPengguna) =>
      authApi.loginPengguna({ nama: nilai.nama, pin: nilai.pin, loginType: "web" }),
  });
}

/** Logout akun ke backend, agar cookie refresh akun tidak berlaku lagi. */
export function useDaftarAkun() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof authApi.daftarAkun>[0]) => authApi.daftarAkun(payload),
  });
}

export function useVerifikasiEmail() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof authApi.verifikasiEmail>[0]) => authApi.verifikasiEmail(payload),
  });
}

export function useKirimVerifikasiEmail() {
  return useMutation({ mutationFn: (email: string) => authApi.kirimVerifikasiEmail(email) });
}

export function useLupaPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.lupaPassword(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof authApi.resetPassword>[0]) => authApi.resetPassword(payload),
  });
}

export function useKirimOtpResetPinOwner() {
  return useMutation({ mutationFn: () => authApi.kirimOtpResetPinOwner() });
}

export function useResetPinOwner() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof authApi.resetPinOwner>[0]) => authApi.resetPinOwner(payload),
  });
}

export function useLogoutAkun() {
  return useMutation({ mutationFn: () => authApi.logoutAkun() });
}

/**
 * Ganti pengguna (keputusan PU2a): hanya sesi pengguna yang diakhiri lewat
 * pin-logout, akun toko tetap masuk, juga setelah dimuat ulang atau di tab
 * baru (backend B378). Bila permintaannya gagal, halaman tidak berpindah,
 * karena cookie refresh pengguna masih berlaku di backend.
 */
export function useGantiPengguna() {
  return useMutation({ mutationFn: () => authApi.logoutPengguna() });
}

/**
 * Logout penuh: sesi pengguna, lalu akun. Logout akun tetap dijalankan
 * walau logout pengguna gagal, karena pin-logout tidak menghapus cookie
 * akun (B378) dan cookie refresh akun tidak boleh tertinggal berlaku.
 * Pengakhiran sesi lokal dan pengalihan diurus pemanggilnya.
 */
export function useKeluar() {
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logoutPengguna();
      } finally {
        await authApi.logoutAkun();
      }
    },
  });
}