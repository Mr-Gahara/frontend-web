"use client";

import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { setTokenAkun, setTokenPengguna } from "@/lib/auth/session";
import { setupApi } from "./api";

type OpsiMutasi<H, V> = Pick<UseMutationOptions<H, Error, V>, "onSuccess" | "onError">;

/**
 * Status setup dari server. Selalu dimuat ulang saat wizard dibuka, karena
 * menentukan langkah awal; aktif hanya setelah sesi akun dipulihkan.
 */
export function useStatusSetup(aktif: boolean) {
  return useQuery({
    queryKey: queryKeys.setup.status(),
    queryFn: setupApi.status,
    enabled: aktif,
    refetchOnMount: "always",
  });
}

function useMutasiSetup<H, V>(jalankan: (v: V) => Promise<H>, simpanSesi: (h: H) => void, opsi: OpsiMutasi<H, V>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jalankan,
    onSuccess: async (...args) => {
      simpanSesi(args[0]);
      await queryClient.invalidateQueries({ queryKey: queryKeys.setup.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/** Nama toko akun dari GET /akun/me (B240), untuk kerangka dan ringkasan setelah dimuat ulang. */
export function useNamaToko(aktif: boolean) {
  return useQuery({
    queryKey: queryKeys.setup.akun(),
    queryFn: setupApi.akunSaya,
    enabled: aktif,
    select: (akun) => akun.daftarTenant?.[0]?.namaToko ?? "",
  });
}

/**
 * Akun pemilik token akun dari GET /akun/me (B240), dibagi wizard dan login
 * pengguna (keputusan rancangan butir 12). Kuncinya sama dengan useNamaToko.
 */
export function useAkunSaya(aktif: boolean) {
  return useQuery({
    queryKey: queryKeys.setup.akun(),
    queryFn: setupApi.akunSaya,
    enabled: aktif,
  });
}

/** Status setup dimuat ulang setelah sebuah langkah tersimpan, agar daftar periksa ikut berubah. */
export function useSegarkanSetup() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.setup.semua });
}

/** Buat toko lalu pakai token akun barunya, yang membawa tenantID untuk daftar Owner. */
export function useBuatToko(opsi: OpsiMutasi<{ accessToken: string }, string> = {}) {
  return useMutasiSetup((namaToko: string) => setupApi.buatToko(namaToko), (h) => setTokenAkun(h.accessToken), opsi);
}

export interface NilaiDaftarOwner {
  nama: string;
  pin: string;
}

/**
 * Daftar Owner lalu masuk sebagai Owner dengan accessToken responsnya,
 * tanpa login PIN (B219). Cookie refresh pengguna ikut dipasang backend,
 * sehingga sesi Owner pulih saat halaman dimuat ulang.
 */
export function useDaftarOwner(opsi: OpsiMutasi<{ accessToken?: string }, NilaiDaftarOwner> = {}) {
  return useMutasiSetup(
    ({ nama, pin }: NilaiDaftarOwner) => setupApi.daftarOwner(nama, pin),
    (h) => {
      if (h.accessToken) setTokenPengguna(h.accessToken);
    },
    opsi,
  );
}
