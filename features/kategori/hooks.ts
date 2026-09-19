"use client";

/**
 * Hook data kategori.
 *
 * Invalidasi mencakup akar produk karena setiap produk membawa nama
 * kategorinya (field kategori hasil lookup di produkService). Catatan: backend
 * menyimpan daftar produk di Redis selama 120 detik dan tidak membersihkannya
 * saat kategori berubah, sehingga nama lama dapat bertahan sampai cache itu
 * kedaluwarsa walau frontend sudah memuat ulang.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kategoriApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { KategoriRequest } from "@/types/kategori";

export function useDaftarKategori() {
  return useQuery({
    queryKey: queryKeys.kategori.daftar(),
    queryFn: kategoriApi.daftar,
  });
}

function useInvalidasiKategori() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.kategori.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua }),
    ]);
}

export function useSimpanKategori() {
  const invalidasi = useInvalidasiKategori();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: KategoriRequest }) =>
      id ? kategoriApi.perbarui(id, data) : kategoriApi.buat(data),
    onSuccess: invalidasi,
  });
}

export function useHapusKategori() {
  const invalidasi = useInvalidasiKategori();
  return useMutation({
    mutationFn: kategoriApi.hapus,
    onSuccess: invalidasi,
  });
}