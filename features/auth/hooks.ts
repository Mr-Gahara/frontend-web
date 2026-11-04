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

export function useLogoutAkun() {
  return useMutation({ mutationFn: () => authApi.logoutAkun() });
}

/**
 * Logout penuh: sesi pengguna, lalu akun. Logout akun tetap dijalankan
 * walau logout pengguna gagal, agar cookie refresh akun tidak tertinggal
 * berlaku. Pengakhiran sesi lokal dan pengalihan diurus pemanggilnya.
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