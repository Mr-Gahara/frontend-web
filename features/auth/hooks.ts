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
export function useLogoutAkun() {
  return useMutation({ mutationFn: () => authApi.logoutAkun() });
}