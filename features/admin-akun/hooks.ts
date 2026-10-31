"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AkunAdmin,
  AktifkanPayload,
  BekukanPayload,
  BuatAkunKlienPayload,
  PerbaruiAkunPayload,
  PerpanjangPayload,
} from "@/types/adminAkun";
import { adminAkunApi } from "./api";
import { akunTidakAda } from "./tampilan";

/** Callback halaman (toast, pengalihan). Invalidasi diurus hook. */
type OpsiMutasi<H, V> = Pick<UseMutationOptions<H, Error, V>, "onSuccess" | "onError">;

/**
 * Seluruh akun platform, termasuk akun admin (keputusan PA7a). Backend
 * mengirimnya sekali muat tanpa paginasi, sehingga pencarian dan filter
 * dilakukan di klien dari satu cache.
 */
export function useDaftarAkun() {
  return useQuery({
    queryKey: queryKeys.adminAkun.daftar(),
    queryFn: adminAkunApi.daftar,
  });
}

/**
 * Detail satu akun (B176). Tidak diulang bila akunnya tidak ada, dan dimuat
 * ulang setiap halaman dibuka agar form ubah diisi dari data terbaru
 * (keputusan rancangan butir 8).
 */
export function useAkun(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminAkun.detail(id ?? ""),
    queryFn: () => adminAkunApi.detail(id!),
    enabled: Boolean(id),
    refetchOnMount: "always",
    retry: (jumlah, err) => !akunTidakAda(err) && jumlah < 3,
  });
}

/** Invalidasi akar ditunggu sebelum callback, agar daftar sudah termuat ulang saat halaman berpindah. */
export function useBuatAkunKlien(opsi: OpsiMutasi<AkunAdmin, BuatAkunKlienPayload> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BuatAkunKlienPayload) => adminAkunApi.buat(payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAkun.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}
export interface AksiAkunVars<P> {
  id: string;
  payload: P;
}

/**
 * Aksi langganan. Invalidasi akar ditunggu sebelum callback, sehingga daftar
 * dan riwayat sudah termuat ulang saat dialog tertutup.
 */
function useAksiAkun<P>(
  jalankan: (vars: AksiAkunVars<P>) => Promise<AkunAdmin>,
  opsi: OpsiMutasi<AkunAdmin, AksiAkunVars<P>>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jalankan,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAkun.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export function useBekukanAkun(opsi: OpsiMutasi<AkunAdmin, AksiAkunVars<BekukanPayload>> = {}) {
  return useAksiAkun<BekukanPayload>(({ id, payload }) => adminAkunApi.bekukan(id, payload), opsi);
}

export function useAktifkanAkun(opsi: OpsiMutasi<AkunAdmin, AksiAkunVars<AktifkanPayload>> = {}) {
  return useAksiAkun<AktifkanPayload>(({ id, payload }) => adminAkunApi.aktifkan(id, payload), opsi);
}

export function usePerpanjangLangganan(
  opsi: OpsiMutasi<AkunAdmin, AksiAkunVars<PerpanjangPayload>> = {},
) {
  return useAksiAkun<PerpanjangPayload>(
    ({ id, payload }) => adminAkunApi.perpanjang(id, payload),
    opsi,
  );
}

/** Riwayat langganan bertahap (keputusan PA11a): halaman berikutnya memakai kursor dari backend. */
export function useRiwayatLangganan(akunId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.adminAkun.riwayat(akunId),
    queryFn: ({ pageParam }) => adminAkunApi.riwayat(akunId, pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (terakhir) => terakhir.cursorBerikutnya,
  });
}

export function usePerbaruiAkun(opsi: OpsiMutasi<unknown, AksiAkunVars<PerbaruiAkunPayload>> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: AksiAkunVars<PerbaruiAkunPayload>) =>
      adminAkunApi.perbarui(id, payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAkun.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export interface HapusAkunVars {
  id: string;
  password: string;
}

/**
 * Callback halaman dijalankan sebelum invalidasi: bila detail dimuat ulang
 * lebih dulu, akun yang baru dihapus sempat tampil sebagai tidak ditemukan
 * sebelum halaman berpindah ke daftar.
 */
export function useHapusAkun(opsi: OpsiMutasi<unknown, HapusAkunVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: HapusAkunVars) => adminAkunApi.hapus(id, password),
    onSuccess: async (...args) => {
      opsi.onSuccess?.(...args);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAkun.semua });
    },
    onError: opsi.onError,
  });
}
