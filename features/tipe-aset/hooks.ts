"use client";

/**
 * Hook data tipe aset.
 *
 * useDaftarTipeAset memakai kunci daftar(), berbeda dari akar tipeAset.semua
 * yang masih diisi halaman aset dan tarif lama dengan data mentah (keputusan
 * rancangan butir 12). Invalidasi mencakup akar tarif dan aset, karena daftar
 * tarif (dataAset) dan daftar aset (dataAset) menampilkan nama tipe aset.
 * Catatan: backend tidak membersihkan cache daftar aset saat tipe aset
 * dihapus (kontrak/temuan.md butir 51), sehingga nama lama dapat bertahan
 * sampai 60 detik walau frontend sudah memuat ulang.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tipeAsetApi } from "./api";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import type { TipeAsetPayload } from "@/types/tipeAset";

export function useDaftarTipeAset() {
  return useQuery({
    queryKey: queryKeys.tipeAset.daftar(),
    queryFn: tipeAsetApi.daftar,
  });
}

/** Detail satu tipe aset; id null berarti belum siap. Tidak mengulang saat 404. */
export function useTipeAset(id: string | null) {
  return useQuery({
    queryKey: queryKeys.tipeAset.detail(id ?? ""),
    queryFn: () => tipeAsetApi.detail(id ?? ""),
    enabled: !!id,
    retry: (jumlah, galat) => !isNotFound(galat) && jumlah < 3,
  });
}

function useInvalidasiTipeAset() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tipeAset.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tarif.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.aset.semua }),
    ]);
}

export function useSimpanTipeAset() {
  const invalidasi = useInvalidasiTipeAset();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TipeAsetPayload }) =>
      id ? tipeAsetApi.perbarui(id, data) : tipeAsetApi.buat(data),
    onSuccess: invalidasi,
  });
}

export function useHapusTipeAset() {
  const invalidasi = useInvalidasiTipeAset();
  return useMutation({
    mutationFn: tipeAsetApi.hapus,
    onSuccess: invalidasi,
  });
}