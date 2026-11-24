"use client";

/**
 * Hook data produk.
 *
 * Invalidasi memakai akar produk agar daftar, detail, dan relasi pajak per
 * produk (queryKeys.produk.pajak) ikut dimuat ulang, karena ketiganya berada
 * di bawah akar yang sama. Promise invalidasi dikembalikan agar mutateAsync
 * baru selesai setelah daftar termuat ulang.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { produkApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { ProdukRequest } from "@/types/produk";

/**
 * Satu halaman daftar produk dari server (P79, B340), untuk halaman daftar
 * produk. Halaman sebelumnya tetap tampil selama halaman berikutnya dimuat.
 * Pemakai lain (form, kasir, diskon, pajak) tetap memuat daftar utuh lewat
 * useDaftarProduk.
 */
export function useHalamanProduk(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.produk.daftar(params),
    queryFn: () => produkApi.halaman(params),
    placeholderData: keepPreviousData,
  });
}

export function useDaftarProduk(opsi: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.produk.daftar(),
    queryFn: produkApi.daftar,
    enabled: opsi.enabled ?? true,
  });
}

/**
 * selaluMuatUlang: muat ulang dari server setiap kali komponen dipasang, walau
 * cache masih segar. Dipakai halaman edit, yang mengisi form dari data ini
 * sekali saat form dipasang.
 */
export function useProduk(
  id: string,
  opsi: { selaluMuatUlang?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.produk.detail(id),
    queryFn: () => produkApi.detail(id),
    enabled: Boolean(id),
    ...(opsi.selaluMuatUlang ? { refetchOnMount: "always" as const } : {}),
  });
}

/** Diekspor untuk halaman produk: hapus yang dijawab 404 memuat ulang daftar (HP1a). */
export function useInvalidasiProduk() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua });
}

export function useHapusProduk() {
  const invalidasi = useInvalidasiProduk();
  return useMutation({
    mutationFn: produkApi.hapus,
    onSuccess: invalidasi,
  });
}

export function useSimpanProduk() {
  const invalidasi = useInvalidasiProduk();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ProdukRequest }) =>
      id ? produkApi.perbarui(id, data) : produkApi.buat(data),
    onSuccess: invalidasi,
  });
}
