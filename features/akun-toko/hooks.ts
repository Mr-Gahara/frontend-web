"use client";

/**
 * Hook Akun Toko. Hanya memanggil API dan menginvalidasi data akun; toast,
 * penutupan dialog, dan pengakhiran sesi diurus pemanggil lewat callback
 * mutate (keputusan rancangan butir 13).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { akunTokoApi, type TujuanOtpAkun } from "./api";

export function useKirimOtpAkun(tujuan: TujuanOtpAkun) {
  return useMutation({ mutationFn: () => akunTokoApi.kirimOtp(tujuan) });
}

/** Email baru dibaca ulang dari GET /akun/me, yang dipakai halaman ini dan login pengguna. */
export function useUbahEmailAkun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; email: string; otp: string }) =>
      akunTokoApi.ubahEmail(v.id, { email: v.email, otp: v.otp }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.setup.akun() }),
  });
}

/** Seluruh sesi toko langsung ditolak backend sesudahnya; pemanggil mengakhiri sesi lokal. */
export function useHapusAkun() {
  return useMutation({
    mutationFn: (v: { pin: string; password: string; namaToko: string; otp: string }) => akunTokoApi.hapus(v),
  });
}

/** Password baru mencabut seluruh sesi akun (M3 backend); pemanggil mengakhiri sesi lokal. */
export function useUbahPasswordAkun() {
  return useMutation({
    mutationFn: (v: { id: string; oldPassword: string; password: string; otp: string }) =>
      akunTokoApi.ubahPassword(v.id, { oldPassword: v.oldPassword, password: v.password, otp: v.otp }),
  });
}
