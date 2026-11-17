"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { penjualanApi } from "@/features/penjualan/api";
import type {
  BuatMembershipPayload,
  PaketMembershipPayload,
  UbahMembershipPayload,
} from "@/types/membership";
import { membershipApi } from "./api";

type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/** Banyaknya penjualan per muatan di dialog Daftarkan (MB2a). */
export const UKURAN_PENJUALAN = 50;

/** Daftar membership utuh; dipakai tab Member, kartu paket, dan lencana laman Pelanggan. */
export function useDaftarMembership(aktif = true) {
  return useQuery({ queryKey: queryKeys.membership.daftar(), queryFn: membershipApi.daftar, enabled: aktif });
}

export function useDaftarPaketMembership(aktif = true) {
  return useQuery({ queryKey: queryKeys.membership.paket(), queryFn: membershipApi.daftarPaket, enabled: aktif });
}

/**
 * Penjualan milik satu pelanggan, 50 terbaru per muatan (urutan bawaan
 * backend createdAt menurun). VOID dan yang sudah dipakai disaring di
 * dialog lewat penjualanTersedia.
 */
export function usePenjualanPelanggan(pelangganID: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.membership.penjualan(pelangganID ?? ""),
    queryFn: ({ pageParam }) =>
      penjualanApi.daftar({ pelangganID: pelangganID as string, page: String(pageParam), limit: String(UKURAN_PENJUALAN) }),
    initialPageParam: 1,
    getNextPageParam: (terakhir, semua) => {
      const p = terakhir.pagination;
      return p && semua.length < p.totalPages ? semua.length + 1 : undefined;
    },
    enabled: Boolean(pelangganID),
  });
}

/** Membership dan paket saling menampilkan (jumlah member per paket), sehingga akar keduanya diinvalidasi. */
function useInvalidasi() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.membership.semua });
}

function useMutasi<T>(fn: (v: T) => Promise<unknown>, opsi: Callback) {
  const invalidasi = useInvalidasi();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export const useBuatMembership = (opsi: Callback = {}) =>
  useMutasi((p: BuatMembershipPayload) => membershipApi.buat(p), opsi);
export const useUbahMembership = (opsi: Callback = {}) =>
  useMutasi(({ id, payload }: { id: string; payload: UbahMembershipPayload }) => membershipApi.ubah(id, payload), opsi);
export const useHapusMembership = (opsi: Callback = {}) => useMutasi((id: string) => membershipApi.hapus(id), opsi);
export const useBuatPaket = (opsi: Callback = {}) =>
  useMutasi((p: PaketMembershipPayload) => membershipApi.buatPaket(p), opsi);
export const useUbahPaket = (opsi: Callback = {}) =>
  useMutasi(({ id, payload }: { id: string; payload: PaketMembershipPayload }) => membershipApi.ubahPaket(id, payload), opsi);
export const useHapusPaket = (opsi: Callback = {}) => useMutasi((id: string) => membershipApi.hapusPaket(id), opsi);
