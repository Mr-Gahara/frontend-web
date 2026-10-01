"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pajakApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { PajakBaru, PerubahanPajak, ProdukPajakRequest } from "@/types/pajak";

/** Callback halaman untuk toast dan reset dialog, sama dengan metode pembayaran (butir 13). */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Pajak per produk yang terpasang pada satu produk. Kuncinya di bawah akar
 * produk, sehingga invalidasi produk.semua ikut memuat ulangnya.
 */
export function useRelasiPajakProduk(produkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.produk.pajak(produkId ?? ""),
    queryFn: () => pajakApi.relasiProduk(produkId as string),
    enabled: !!produkId,
  });
}

/**
 * Perubahan dan penghapusan pajak menyentuh produk juga: pajakList produk
 * memuat nama pajak, relasi ke pajak nonaktif disaring backend, dan hapus
 * pajak ikut menghapus relasinya. Invalidasi ditunggu sebelum callback
 * halaman, agar dialog tertutup setelah daftar termuat ulang.
 */
function useInvalidasiPajakDanProduk() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.pajak.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua }),
    ]);
}

/**
 * Seluruh pajak tenant, dipakai halaman pengaturan pajak dan pilihan pajak
 * buat penjualan. Kunci daftar() berada di bawah akar pajak.semua.
 */
export function useDaftarPajak() {
  return useQuery({
    queryKey: queryKeys.pajak.daftar(),
    queryFn: pajakApi.daftar,
  });
}

/** Membuat pajak tidak menyentuh produk; cukup akar pajak. */
export function useBuatPajak(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PajakBaru) => pajakApi.buat(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pajak.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function usePerbaruiPajak(opsi: Callback = {}) {
  const invalidasi = useInvalidasiPajakDanProduk();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PerubahanPajak }) => pajakApi.perbarui(id, payload),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useHapusPajak(opsi: Callback = {}) {
  const invalidasi = useInvalidasiPajakDanProduk();
  return useMutation({
    mutationFn: (id: string) => pajakApi.hapus(id),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

/**
 * Pasang dan lepas mengubah relasi (queryKeys.produk.pajak, di bawah akar
 * produk). pajakList produk tidak ikut berubah, karena backend 465b438
 * membentuknya dari field pajak di dokumen produk, bukan dari relasi
 * (kontrak/temuan.md butir 88); invalidasi akar produk dipertahankan agar
 * pajakList ikut termuat ulang begitu backend menyatukan keduanya.
 */
export function usePasangPajak(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProdukPajakRequest) => pajakApi.pasang(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useLepasPajak(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (relasiId: string) => pajakApi.lepas(relasiId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}