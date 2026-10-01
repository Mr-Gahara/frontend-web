"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { penjualanApi } from "./api";
import { filterServerPenjualan, paramUrutanPenjualan } from "./filter";
import { queryKeys } from "@/lib/queryKeys";
import { isNotFound } from "@/lib/api/error";
import { susunPayloadFinalisasi, susunPayloadVoidPenjualan } from "./payload";
import type { PenjualanFilterParams, PenjualanRequest } from "@/types/penjualan";

type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/** Jumlah baris per halaman daftar, sama dengan ukuran halaman DataTable. */
/**
 * Satu halaman daftar penjualan tenant. Backend 465b438 selalu mengirim
 * daftar per halaman (20 terbaru tanpa page), sehingga halaman dan limit
 * dikirim dan ikut menjadi kunci. Data halaman sebelumnya dipertahankan
 * selama halaman berikutnya dimuat. siap false berarti lingkup belum siap
 * dan belum ada permintaan.
 */
export function useDaftarPenjualan(
  filter: PenjualanFilterParams,
  halaman: number,
  ukuran: number,
  siap: boolean,
  urutan: readonly { id: string; desc: boolean }[] = [],
) {
  const params = {
    ...filterServerPenjualan(filter),
    ...paramUrutanPenjualan(urutan),
    page: String(halaman),
    limit: String(ukuran),
  };
  return useQuery({
    queryKey: queryKeys.penjualan.daftar(params),
    queryFn: () => penjualanApi.daftar(params),
    enabled: siap,
    placeholderData: keepPreviousData,
  });
}

/** Detail penjualan; tidak mengulang permintaan saat 404 karena dokumennya memang tidak ada. */
export function usePenjualan(id: string) {
  return useQuery({
    queryKey: queryKeys.penjualan.detail(id),
    queryFn: () => penjualanApi.detail(id),
    enabled: Boolean(id),
    retry: (jumlah, err) => !isNotFound(err) && jumlah < 3,
  });
}

function useInvalidasiPenjualan() {
  const queryClient = useQueryClient();
  // Void juga membatalkan sesi booking penjualan itu di backend.
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sesiBooking.semua }),
    ]);
}

export function useVoidPenjualan({ onSuccess, onError }: Callback = {}) {
  const invalidasi = useInvalidasiPenjualan();
  return useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) =>
      penjualanApi.perbarui(id, susunPayloadVoidPenjualan(alasan)),
    onSuccess: async () => {
      await invalidasi();
      onSuccess?.();
    },
    onError,
  });
}

/**
 * Finalisasi memotong stok bahan di outlet dan produk.stok, lalu menulis
 * jurnal stok, sehingga inventory, produk, dan jurnal stok ikut diinvalidasi.
 */
export function useFinalisasiPenjualan(id: string, { onSuccess, onError }: Callback = {}) {
  const queryClient = useQueryClient();
  const invalidasi = useInvalidasiPenjualan();
  return useMutation({
    mutationFn: (locationID: string | undefined) =>
      penjualanApi.perbarui(id, susunPayloadFinalisasi(locationID)),
    onSuccess: async () => {
      await Promise.all([
        invalidasi(),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.jurnalStok.semua }),
      ]);
      onSuccess?.();
    },
    onError,
  });
}

/**
 * Membuat penjualan dengan kunci idempotensi (keputusan K3a): backend menahan
 * permintaan dengan kunci yang sama selama 24 jam, sehingga klik ganda atau
 * percobaan ulang tidak membuat dua penjualan.
 */
export function useBuatPenjualan({ onSuccess, onError }: Callback = {}) {
  const invalidasi = useInvalidasiPenjualan();
  return useMutation({
    mutationFn: ({ payload, kunci }: { payload: PenjualanRequest; kunci: string }) =>
      penjualanApi.buat(payload, kunci),
    onSuccess: async () => {
      await invalidasi();
      onSuccess?.();
    },
    onError,
  });
}

export function useHapusPenjualan({ onSuccess, onError }: Callback = {}) {
  const invalidasi = useInvalidasiPenjualan();
  return useMutation({
    mutationFn: (id: string) => penjualanApi.hapus(id),
    onSuccess: async () => {
      await invalidasi();
      onSuccess?.();
    },
    onError,
  });
}