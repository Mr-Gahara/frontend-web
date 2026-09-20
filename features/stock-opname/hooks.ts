import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { isNotFound } from "@/lib/api/error";
import { stockOpnameApi, type FilterStockOpname } from "./api";
import type { ItemHitungan } from "./payload";
import type { CreateOpnameRequest, StockOpname } from "@/types/stockOpname";

/** filter null berarti belum siap (cakupan lokasi belum diketahui). */
export function useDaftarStockOpname(filter: FilterStockOpname | null) {
  return useQuery({
    queryKey: queryKeys.stockOpname.daftar(filter ?? undefined),
    queryFn: () => stockOpnameApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
}

/** Detail satu dokumen; tidak mengulang permintaan bila dokumen tidak ada. */
export function useStockOpname(id: string) {
  return useQuery({
    queryKey: queryKeys.stockOpname.detail(id),
    queryFn: () => stockOpnameApi.detail(id),
    enabled: !!id,
    retry: (jumlah, err) => !isNotFound(err) && jumlah < 3,
  });
}

/** Callback halaman (toast, tutup dialog). Invalidasi diurus hook. */
type OpsiMutasi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

function useMutasiOpname<V>(
  fn: (variabel: V) => Promise<unknown>,
  opsi: OpsiMutasi<V>,
  kunciLain: readonly (readonly unknown[])[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname.semua });
      for (const kunci of kunciLain) queryClient.invalidateQueries({ queryKey: kunci });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export function useSimpanHitungan(id: string, opsi: OpsiMutasi<{ items: ItemHitungan[] }> = {}) {
  return useMutasiOpname((payload: { items: ItemHitungan[] }) => stockOpnameApi.simpanItem(id, payload), opsi);
}

export function useAjukanOpname(id: string, opsi: OpsiMutasi<void> = {}) {
  return useMutasiOpname(() => stockOpnameApi.ajukan(id), opsi);
}

/** Setujui membuat adjustment dan mengubah stok, sehingga stok, jurnal, dan adjustment ikut dimuat ulang. */
export function useSetujuiOpname(id: string, opsi: OpsiMutasi<string> = {}) {
  return useMutasiOpname((alasan: string) => stockOpnameApi.setujui(id, alasan), opsi, [
    queryKeys.inventory.semua,
    queryKeys.jurnalStok.semua,
    queryKeys.stockAdjustment.semua,
  ]);
}

export function useTolakOpname(id: string, opsi: OpsiMutasi<string> = {}) {
  return useMutasiOpname((catatanReview: string) => stockOpnameApi.tolak(id, catatanReview), opsi);
}

export function useBatalkanOpname(id: string, opsi: OpsiMutasi<void> = {}) {
  return useMutasiOpname(() => stockOpnameApi.batalkan(id), opsi);
}

/** Membuat draft; onSuccess menerima dokumen baru untuk berpindah ke detailnya. */
export function useBuatOpname(
  opsi: Pick<UseMutationOptions<StockOpname, Error, CreateOpnameRequest>, "onSuccess" | "onError"> = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOpnameRequest) => stockOpnameApi.buat(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}
