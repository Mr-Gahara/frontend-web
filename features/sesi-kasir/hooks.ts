"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { PerangkatKasir, SesiKasir } from "@/types/sesiKasir";
import { sesiKasirApi } from "./api";
import type { PayloadMesinKasir } from "./dialog-mesin-kasir";
import type { PayloadTutupKasir } from "./dialog-tutup-kasir";
import {
  BATAS_KASIR_BUKA,
  UKURAN_HALAMAN_RIWAYAT,
  paramsRiwayat,
  type NilaiFilterRiwayat,
} from "./filter";

/** Callback halaman untuk toast dan dialog (keputusan rancangan butir 13). */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

const PARAMS_KASIR_BUKA = { status: "BUKA", limit: String(BATAS_KASIR_BUKA) };

/** Kasir yang sedang buka di seluruh mesin kasir toko. */
export function useKasirBuka() {
  return useQuery({
    queryKey: queryKeys.sesiKasir.daftar(PARAMS_KASIR_BUKA),
    queryFn: () => sesiKasirApi.daftar(PARAMS_KASIR_BUKA),
    select: (hasil) => hasil.data,
  });
}

const PARAMS_ADA_SESI = { limit: "1" };

/**
 * Apakah toko sudah pernah punya sesi kasir: satu sesi tanpa filter, dibaca
 * dari total paginasi. Dipakai saat belum ada mesin kasir, untuk membedakan
 * pemakaian pertama dari mesin yang sudah dilepas semua.
 */
export function useAdaSesiKasir(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sesiKasir.daftar(PARAMS_ADA_SESI),
    queryFn: () => sesiKasirApi.daftar(PARAMS_ADA_SESI),
    select: (hasil) => (hasil.pagination?.total ?? hasil.data.length) > 0,
    enabled,
  });
}

/** Riwayat sesi yang sudah ditutup, dimuat per halaman lewat Muat lebih banyak. */
export function useRiwayatSesi(filter: NilaiFilterRiwayat) {
  const params = { ...paramsRiwayat(filter), limit: String(UKURAN_HALAMAN_RIWAYAT) };
  return useInfiniteQuery({
    queryKey: queryKeys.sesiKasir.daftar(params),
    queryFn: ({ pageParam }) => sesiKasirApi.daftar({ ...params, page: String(pageParam) }),
    initialPageParam: 1,
    getNextPageParam: (terakhir) => {
      const p = terakhir.pagination;
      return p && p.page < p.totalPages ? p.page + 1 : undefined;
    },
  });
}

/**
 * Detail satu sesi beserta ringkasan tunai. Dimuat ulang setiap halaman
 * dibuka, karena kasir yang buka dapat ditutup dari aplikasi kapan saja.
 */
export function useDetailSesi(id: string) {
  return useQuery({
    queryKey: queryKeys.sesiKasir.detail(id),
    queryFn: () => sesiKasirApi.detail(id),
    refetchOnMount: "always",
  });
}

/**
 * Satu halaman daftar periode laporan tutup kasir (B375); paginasi server
 * bersama seluruh filternya (keputusan rancangan butir 27).
 */
export function useDaftarPeriode(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.sesiKasir.periode(params),
    queryFn: () => sesiKasirApi.daftarPeriode(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Detail periode beserta laporannya. Dimuat ulang setiap halaman dibuka,
 * karena periode BUKA dapat ditutup dari aplikasi kapan saja.
 */
export function useDetailPeriode(id: string) {
  return useQuery({
    queryKey: queryKeys.sesiKasir.periodeDetail(id),
    queryFn: () => sesiKasirApi.detailPeriode(id),
    refetchOnMount: "always",
  });
}

/** Daftar mesin kasir; hanya dimuat bagi pemegang izin kelola. */
export function useDaftarMesinKasir(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sesiKasir.perangkat(),
    queryFn: sesiKasirApi.daftarPerangkat,
    enabled,
  });
}

/**
 * Sesi terbaru tiap mesin kasir, untuk keterangan terakhir dipakai
 * (installationId dan limit 1; backend mengurutkan dibukaPada menurun).
 * Mesin yang sesinya belum termuat tidak masuk hasil.
 */
export function useSesiTerakhir(mesin: readonly PerangkatKasir[] | undefined) {
  return useQueries({
    queries: (mesin ?? []).map((m) => {
      const params = { installationId: m.installationId, limit: "1" };
      return {
        queryKey: queryKeys.sesiKasir.daftar(params),
        queryFn: () => sesiKasirApi.daftar(params),
      };
    }),
    combine: (hasil) => {
      const peta: Record<string, SesiKasir | null> = {};
      (mesin ?? []).forEach((m, i) => {
        const data = hasil[i]?.data;
        if (data) peta[m.installationId] = data.data[0] ?? null;
      });
      return peta;
    },
  });
}

/**
 * Perangkat trusted se-toko untuk pilihan perangkat mesin kasir (B334,
 * MK3b), dimuat bagi pemegang izin kelola mesin kasir.
 */
export function usePerangkatToko(enabled: boolean) {
  const kueri = useQuery({
    queryKey: queryKeys.sesiKasir.perangkatToko(),
    queryFn: sesiKasirApi.perangkatToko,
    enabled,
  });
  return { memuat: kueri.isLoading, daftar: kueri.data ?? [] };
}

function useInvalidasiSesiKasir() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.sesiKasir.semua });
}

/** Tambah atau ubah mesin kasir (upsert per installationId). */
export function useSimpanMesinKasir(opsi: Callback = {}) {
  const invalidasi = useInvalidasiSesiKasir();
  return useMutation({
    mutationFn: (payload: PayloadMesinKasir) => sesiKasirApi.simpanPerangkat(payload),
    onSuccess: () => {
      invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

/** Berhenti jadi mesin kasir; riwayat sesinya tetap tersimpan. */
export function useHapusMesinKasir(opsi: Callback = {}) {
  const invalidasi = useInvalidasiSesiKasir();
  return useMutation({
    mutationFn: (id: string) => sesiKasirApi.hapusPerangkat(id),
    onSuccess: () => {
      invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

/**
 * Tutup kasir dari web. Selisih hitungan menyamakan saldo laci dan menulis
 * mutasi selisih kas, sehingga akar akunKas ikut diinvalidasi (keputusan
 * rancangan butir 3).
 */
export function useTutupSesiKasir(opsi: Callback = {}) {
  const invalidasi = useInvalidasiSesiKasir();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadTutupKasir }) =>
      sesiKasirApi.tutup(id, payload),
    onSuccess: () => {
      invalidasi();
      queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}
