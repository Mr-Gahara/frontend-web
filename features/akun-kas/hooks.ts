"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { akunKasApi, type PayloadUbahAkunKas } from "./api";
import { filterServerMutasi, paramPeriodeMutasi, type FilterMutasi } from "./mutasi";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Daftar akun kas tenant, dipakai halaman keuangan, kartu ringkasan,
 * pembayaran penjualan, dan form metode pembayaran (pilihan akun tujuan).
 */
export function useDaftarAkunKas() {
  return useQuery({
    queryKey: queryKeys.akunKas.daftar(),
    queryFn: akunKasApi.daftar,
  });
}

/** Callback halaman untuk toast dan navigasi, sama dengan penjualan dan pembayaran. */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Buat akun kas. Invalidasi memakai akar akunKas.semua, sehingga seluruh
 * varian di bawahnya ikut dimuat ulang (keputusan rancangan butir 3). Toast
 * dan navigasi dari halaman (butir 13).
 */
export function useBuatAkunKas(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: akunKasApi.buat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

/**
 * Ubah akun kas lewat PUT /akunkas/:id: sunting isian, nonaktifkan, dan
 * aktifkan kembali (keputusan UA1a sampai UA4a). Metode pembayaran ikut
 * diinvalidasi karena responsnya memuat nama dan nomor akun kas tujuan,
 * dan backend membuang cache metode pada perubahan yang sama.
 */
export function useUbahAkunKas(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadUbahAkunKas }) =>
      akunKasApi.ubah(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua });
      queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

/**
 * Satu halaman buku mutasi gabungan (keputusan MK1a). Data halaman sebelumnya
 * dipertahankan selama halaman berikutnya dimuat. Selalu dimuat ulang saat
 * dibuka (staleTime 0), karena pembayaran dan pembatalannya mengubah buku
 * tanpa menginvalidasi akar akunKas.
 */
export function useDaftarMutasi(filter: FilterMutasi, halaman: number, ukuran: number) {
  const params = { ...filterServerMutasi(filter), page: String(halaman), limit: String(ukuran) };
  return useQuery({
    queryKey: queryKeys.akunKas.mutasi(params),
    queryFn: () => akunKasApi.mutasi(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/**
 * Ringkasan periode: satu akun kas bila dipilih, atau gabungan seluruh akun
 * kas bila tidak (keputusan NZ1a, menggantikan MK2a; backend nizar c29310c).
 */
export function useRingkasanMutasi(filter: FilterMutasi) {
  const periode = paramPeriodeMutasi(filter);
  const id = filter.akunKasID;
  return useQuery({
    queryKey: queryKeys.akunKas.ringkasan(id || "semua", periode),
    queryFn: () => (id ? akunKasApi.ringkasan(id, periode) : akunKasApi.ringkasanGabungan(periode)),
    staleTime: 0,
  });
}
