"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import type {
  PayloadBuatPembelianStok,
  PayloadUbahPembelianStok,
  PembelianStokTersimpan,
} from "@/types/pembelianStok";
import { pembelianStokApi } from "./api";

/** Callback halaman untuk toast, dialog, dan navigasi (keputusan rancangan butir 13). */
type Callback<T = void> = { onSuccess?: (hasil: T) => void; onError?: (err: unknown) => void };

/**
 * Satu halaman daftar pembelian (B103). params disusun paramDaftarPembelian;
 * null berarti lokasi ruang belum diketahui, sehingga belum ada permintaan.
 * Data halaman sebelumnya dipertahankan selama halaman berikutnya dimuat.
 */
export function useDaftarPembelianStok(params: Record<string, string> | null) {
  return useQuery({
    queryKey: queryKeys.pembelianStok.daftar(params ?? undefined),
    queryFn: () => pembelianStokApi.daftar(params ?? {}),
    enabled: params !== null,
    placeholderData: keepPreviousData,
  });
}

/**
 * Detail pembelian. Dimuat ulang setiap halaman dibuka, karena form ubah
 * memakai datanya sebagai nilai awal (keputusan rancangan butir 8), dan
 * tidak diulang saat 404.
 */
export function usePembelianStok(id: string) {
  return useQuery({
    queryKey: queryKeys.pembelianStok.detail(id),
    queryFn: () => pembelianStokApi.detail(id),
    refetchOnMount: "always",
    retry: (hitungan, err) => !isNotFound(err) && hitungan < 3,
  });
}

/**
 * Mencatat dan menghapus pembelian mengubah stok, jurnal stok, dan riwayat
 * bahan baku (bahan yang pernah dibeli tidak dapat dihapus), sehingga akar
 * inventory, jurnalStok, dan bahanBaku ikut diinvalidasi bersama akar
 * pembelian (keputusan rancangan butir 3). Akar akunKas tidak ikut, karena
 * backend belum memotong saldo; tambahkan begitu backend memotongnya.
 * Mengubah info hanya menyentuh pembelian.
 */
function useInvalidasiPembelian(ikutStok: boolean) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.pembelianStok.semua }),
      ...(ikutStok
        ? [
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua }),
            queryClient.invalidateQueries({ queryKey: queryKeys.jurnalStok.semua }),
            queryClient.invalidateQueries({ queryKey: queryKeys.bahanBaku.semua }),
          ]
        : []),
    ]);
}

/** Invalidasi ditunggu sebelum callback, agar daftar sudah termuat ulang saat halaman berpindah. */
export function useBuatPembelianStok(opsi: Callback<PembelianStokTersimpan> = {}) {
  const invalidasi = useInvalidasiPembelian(true);
  return useMutation({
    mutationFn: (payload: PayloadBuatPembelianStok) => pembelianStokApi.buat(payload),
    onSuccess: async (hasil) => {
      await invalidasi();
      opsi.onSuccess?.(hasil);
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function usePerbaruiPembelianStok(opsi: Callback = {}) {
  const invalidasi = useInvalidasiPembelian(false);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadUbahPembelianStok }) =>
      pembelianStokApi.perbarui(id, payload),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

/**
 * Callback dijalankan lebih dulu, seperti useHapusAkun, agar detail yang
 * baru dihapus tidak sempat dimuat ulang dan tampil sebagai tidak
 * ditemukan; invalidasi berjalan sesudahnya.
 */
export function useHapusPembelianStok(opsi: Callback = {}) {
  const invalidasi = useInvalidasiPembelian(true);
  return useMutation({
    mutationFn: (id: string) => pembelianStokApi.hapus(id),
    onSuccess: async () => {
      opsi.onSuccess?.();
      await invalidasi();
    },
    onError: (err) => opsi.onError?.(err),
  });
}