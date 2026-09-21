import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { isNotFound } from "@/lib/api/error";
import { pengajuanStokApi, type FilterPengajuanStok } from "./api";
import type { PayloadPengajuan } from "./payload";

/** Daftar pengajuan stok; argumen null berarti cakupan belum siap, tanpa permintaan. */
export function useDaftarPengajuanStok(filter: FilterPengajuanStok | null) {
  return useQuery({
    queryKey: queryKeys.pengajuanStok.daftar({ ...filter }),
    queryFn: () => pengajuanStokApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
}

/**
 * Detail pengajuan. Tidak mengulang permintaan saat 404, dan selalu dimuat
 * ulang saat halaman dibuka karena form edit membaca nilai awalnya sekali
 * (keputusan rancangan butir 8).
 */
export function usePengajuanStok(id: string) {
  return useQuery({
    queryKey: queryKeys.pengajuanStok.detail(id),
    queryFn: () => pengajuanStokApi.detail(id),
    enabled: id !== "",
    retry: (jumlah, err) => !isNotFound(err) && jumlah < 3,
    refetchOnMount: "always",
  });
}

type OpsiMutasi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

/** Semua perubahan pengajuan menginvalidasi akar domain: daftar dan detail sekaligus. */
function useMutasiPengajuan<V>(jalankan: (vars: V) => Promise<unknown>, opsi: OpsiMutasi<V>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jalankan,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export function useBuatPengajuan(opsi: OpsiMutasi<PayloadPengajuan> = {}) {
  return useMutasiPengajuan((payload: PayloadPengajuan) => pengajuanStokApi.buat(payload), opsi);
}

export function usePerbaruiPengajuan(id: string, opsi: OpsiMutasi<PayloadPengajuan> = {}) {
  return useMutasiPengajuan((payload: PayloadPengajuan) => pengajuanStokApi.perbarui(id, payload), opsi);
}

export function useAjukanPengajuan(id: string, opsi: OpsiMutasi<void> = {}) {
  return useMutasiPengajuan(() => pengajuanStokApi.ajukan(id), opsi);
}

export function useSetujuiPengajuan(id: string, opsi: OpsiMutasi<void> = {}) {
  return useMutasiPengajuan(() => pengajuanStokApi.setujui(id), opsi);
}

export function useTolakPengajuan(id: string, opsi: OpsiMutasi<string> = {}) {
  return useMutasiPengajuan((alasan: string) => pengajuanStokApi.tolak(id, alasan), opsi);
}
