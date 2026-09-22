import { useMutation, useQuery, useQueryClient, type QueryKey, type UseMutationOptions } from "@tanstack/react-query";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import {
  transferStokApi,
  type FilterTransferStok,
  type PayloadRevisi,
  type TransferDariPengajuan,
  type TransferDibuat,
} from "./api";
import type { ItemPayloadTerima } from "./payload";

type OpsiMutasi<D, V> = Pick<UseMutationOptions<D, Error, V>, "onSuccess" | "onError">;

/** Surat jalan dari pengajuan APPROVED atau PENDING; pengajuan ikut berubah, jadi keduanya diinvalidasi. */
export function useBuatSuratJalan(opsi: OpsiMutasi<TransferDibuat, TransferDariPengajuan> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferDariPengajuan) => transferStokApi.buatDariPengajuan(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transferStok.semua });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/**
 * Daftar surat jalan. Argumen null berarti belum siap (misalnya cakupan
 * lokasi masih dimuat). Filter dikirim walau backend mengabaikannya hari ini;
 * halaman tetap menyaring lewat saringTransfer (filter.ts).
 */
export function useDaftarTransferStok(filter: FilterTransferStok | null, opsi: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.transferStok.daftar(filter ?? undefined),
    queryFn: () => transferStokApi.daftar(filter ?? {}),
    enabled: filter !== null,
    refetchInterval: opsi.refetchInterval,
  });
}

/** Detail tidak diulang saat 404, dan dimuat ulang saat halaman dibuka agar form diisi dari data terbaru. */
export function useTransferStok(id: string) {
  return useQuery({
    queryKey: queryKeys.transferStok.detail(id),
    queryFn: () => transferStokApi.detail(id),
    enabled: id !== "",
    retry: (jumlah, err) => !isNotFound(err) && jumlah < 3,
    refetchOnMount: "always",
  });
}

type OpsiAksi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

/** Mutation aksi surat jalan; akar yang diinvalidasi mengikuti efek backend setiap aksi. */
function useAksiSuratJalan<V>(jalankan: (vars: V) => Promise<unknown>, akar: readonly QueryKey[], opsi: OpsiAksi<V>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jalankan,
    onSuccess: (...args) => {
      for (const kunci of akar) queryClient.invalidateQueries({ queryKey: kunci });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/** Kirim memotong stok gudang dan mencatat jurnal Keluar. */
export function useKirimSuratJalan(id: string, opsi: OpsiAksi<void> = {}) {
  return useAksiSuratJalan(
    () => transferStokApi.kirim(id),
    [queryKeys.transferStok.semua, queryKeys.inventory.semua, queryKeys.jurnalStok.semua],
    opsi,
  );
}

export function useRevisiSuratJalan(id: string, opsi: OpsiAksi<PayloadRevisi> = {}) {
  return useAksiSuratJalan((payload: PayloadRevisi) => transferStokApi.revisi(id, payload), [queryKeys.transferStok.semua], opsi);
}

/** Terima menambah stok outlet, mencatat jurnal Masuk, dan menjadikan pengajuan COMPLETED. */
export function useTerimaSuratJalan(id: string, opsi: OpsiAksi<{ items: ItemPayloadTerima[] }> = {}) {
  return useAksiSuratJalan(
    (payload: { items: ItemPayloadTerima[] }) => transferStokApi.terima(id, payload),
    [queryKeys.transferStok.semua, queryKeys.inventory.semua, queryKeys.jurnalStok.semua, queryKeys.pengajuanStok.semua],
    opsi,
  );
}

/** Batal mengembalikan pengajuan ke PENDING; dari DIKIRIM juga mengembalikan stok gudang. */
export function useBatalSuratJalan(id: string, opsi: OpsiAksi<void> = {}) {
  return useAksiSuratJalan(
    () => transferStokApi.batal(id),
    [queryKeys.transferStok.semua, queryKeys.pengajuanStok.semua, queryKeys.inventory.semua, queryKeys.jurnalStok.semua],
    opsi,
  );
}