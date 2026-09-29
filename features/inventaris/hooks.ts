"use client";

/**
 * Hook data inventaris dan lokasi.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { inventoryApi, lokasiApi, type FilterInventory } from "./api";
import { lokasiTunggal } from "./lokasi";
import type { TambahInventoryPayload } from "@/types/inventory";
import { useMemo } from "react";
import { useSession } from "@/lib/auth/useSession";
import { bolehLintasOutlet } from "@/lib/auth/permissions";
import { tentukanCakupan, type CakupanLokasiOutlet } from "./cakupan";
import { queryKeys } from "@/lib/queryKeys";
import type { BuatLokasiPayload, PerbaruiLokasiPayload, TipeLokasi } from "@/types/location";

/**
 * aktif: false mematikan permintaan, misalnya bagi pengguna tanpa
 * read-location di daftar penjualan (keputusan K11b). Bawaan true.
 */
type OpsiKueri = { aktif?: boolean };

export function useDaftarLokasi({ aktif = true }: OpsiKueri = {}) {
  return useQuery({
    queryKey: queryKeys.lokasi.daftar(),
    queryFn: lokasiApi.daftar,
    staleTime: 5 * 60 * 1000,
    enabled: aktif,
  });
}

/**
 * Lokasi pertama dengan tipe tertentu.
 *
 * Halaman outlet dan gudang masing-masing bekerja pada satu lokasi, dan
 * backend belum menyediakan endpoint untuk memilihnya secara langsung.
 */
export function useLokasiBertipe(tipe: TipeLokasi) {
  // Berbagi kunci dengan useDaftarLokasi, sehingga keduanya memakai satu
  // permintaan. Kunci lokasi.daftar({ tipe }) sengaja tidak dipakai karena
  // halaman lama masih mengisinya lewat apiClient dengan bentuk berbeda.
  const { data, ...sisa } = useQuery({
    queryKey: queryKeys.lokasi.daftar(),
    queryFn: lokasiApi.daftar,
    staleTime: 5 * 60 * 1000,
    select: (daftar) => daftar.find((l) => l.tipe === tipe) ?? null,
  });
  return { ...sisa, lokasi: data ?? null, lokasiId: data?.id ?? "" };
}

/**
 * Daftar stok. filter null berarti belum siap (misalnya lokasi belum
 * diketahui), sehingga tidak ada permintaan; filter tanpa locationID berarti
 * seluruh lokasi.
 */
export function useDaftarInventory(filter: FilterInventory | null) {
  return useQuery({
    queryKey: queryKeys.inventory.daftar(filter ?? undefined),
    queryFn: () => inventoryApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
}

/**
 * Lokasi kerja pengguna saat ini (/location/current), diseragamkan lewat
 * lokasiTunggal karena kunci cache ini dapat terbagi dengan halaman lama.
 */
export function useLokasiAktif({ aktif = true }: OpsiKueri = {}) {
  const { data, ...sisa } = useQuery({
    queryKey: queryKeys.lokasi.aktif(),
    queryFn: lokasiApi.aktif,
    staleTime: 5 * 60 * 1000,
    enabled: aktif,
  });
  const lokasi = lokasiTunggal(data);
  return { ...sisa, lokasi, lokasiId: lokasi?.id ?? "" };
}

/** Callback halaman (toast, reset dialog). Invalidasi diurus hook. */
type OpsiMutasi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

export interface UbahStokMinimumVars {
  id: string;
  stokMinimum: number;
}

export interface OpnameVars {
  id: string;
  fisikAktual: number;
  catatan: string;
}

export function useUbahStokMinimum(opsi: OpsiMutasi<UbahStokMinimumVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stokMinimum }: UbahStokMinimumVars) =>
      inventoryApi.ubahStokMinimum(id, { stokMinimum }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/** Opname cepat juga mencatat jurnal stok di backend, sehingga jurnal ikut dimuat ulang. */
export function useOpnameInventory(opsi: OpsiMutasi<OpnameVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fisikAktual, catatan }: OpnameVars) =>
      inventoryApi.opname(id, { fisikAktual, catatan }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
      queryClient.invalidateQueries({ queryKey: queryKeys.jurnalStok.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export function useTambahInventory(opsi: OpsiMutasi<TambahInventoryPayload> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TambahInventoryPayload) => inventoryApi.buat(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/**
 * Membuat lokasi baru (setup gudang). Invalidasi ditunggu sebelum callback
 * halaman, agar layout gudang membaca daftar lokasi yang sudah memuat gudang
 * baru saat halaman berpindah, alih-alih mengalihkan kembali ke setup, dan
 * menu Ruang Gudang di sidebar muncul tanpa muat ulang (keputusan GD5a).
 */
export function useBuatLokasi(opsi: OpsiMutasi<BuatLokasiPayload> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BuatLokasiPayload) => lokasiApi.buat(payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lokasi.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export interface PerbaruiLokasiVars {
  id: string;
  payload: PerbaruiLokasiPayload;
}

/**
 * Mengubah profil lokasi (pengaturan gudang, keputusan GD2a). Seperti
 * useBuatLokasi, invalidasi ditunggu sebelum callback halaman, agar form
 * yang dipasang ulang dan layout gudang membaca nilai yang tersimpan.
 */
export function usePerbaruiLokasi(opsi: OpsiMutasi<PerbaruiLokasiVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: PerbaruiLokasiVars) => lokasiApi.perbarui(id, payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lokasi.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/**
 * Cakupan lokasi halaman di ruang outlet: pemegang izin lintas outlet
 * (bolehLintasOutlet) melihat seluruh outlet dengan pemilih, pengguna lain
 * terkunci ke lokasi aktif. Lokasi aktif adalah outlet milik tenant
 * (GET /location/current selalu mencari lokasi bertipe Outlet), karena
 * pengguna hanya terikat ke tenant. Akses ditentukan permission, bukan nama
 * role maupun lokasi pengguna. Pembatasan ini hanya di tampilan; backend
 * mengirim data seluruh tenant kepada pemegang izin baca.
 */
export function useCakupanLokasiOutlet(opsi: OpsiKueri = {}): CakupanLokasiOutlet {
  const { sedangMemuat, permissions } = useSession();
  const lintasOutlet = bolehLintasOutlet(permissions);
  const daftar = useDaftarLokasi(opsi);
  const aktif = useLokasiAktif(opsi);

  return useMemo(
    () =>
      tentukanCakupan({
        sesiMemuat: sedangMemuat,
        lintasOutlet,
        daftarLokasi: daftar.data,
        gagalDaftar: daftar.isError,
        lokasiAktif: aktif.lokasi,
        memuatAktif: aktif.isLoading,
        gagalAktif: aktif.isError,
      }),
    [sedangMemuat, lintasOutlet, daftar.data, daftar.isError, aktif.lokasi, aktif.isLoading, aktif.isError],
  );
}

/** Keadaan lokasi satu ruang kerja; lokasiId null berarti belum ada atau tidak dipakai. */
export type LokasiRuang = { lokasiId: string | null; memuat: boolean; gagal: boolean };

/**
 * Lokasi satu ruang kerja: outlet tenant untuk ruang outlet, dan lokasi
 * Gudang pertama untuk ruang gudang (model MVP). Dipakai untuk memisahkan
 * data per ruang (shift, pola roster) begitu backend mendukungnya. aktif
 * false berarti pemisahan belum didukung, sehingga tidak ada permintaan
 * lokasi. Lokasi yang sudah termuat tetapi tidak ada dianggap gagal, agar
 * halaman tidak menampilkan daftar kosong seolah-olah belum ada data.
 */
export function useLokasiRuang(
  ruang: "outlet" | "gudang",
  { aktif = true }: OpsiKueri = {},
): LokasiRuang {
  const outlet = useLokasiAktif({ aktif: aktif && ruang === "outlet" });
  const daftar = useDaftarLokasi({ aktif: aktif && ruang === "gudang" });
  if (!aktif) return { lokasiId: null, memuat: false, gagal: false };
  const kueri = ruang === "outlet" ? outlet : daftar;
  // useLokasiAktif mengembalikan lokasiId "" bila tenant belum punya outlet.
  const lokasiId =
    ruang === "outlet"
      ? outlet.lokasiId || null
      : (daftar.data?.find((l) => l.tipe === "Gudang")?.id ?? null);
  const memuat = kueri.isLoading;
  return { lokasiId, memuat, gagal: kueri.isError || (!memuat && lokasiId === null) };
}
