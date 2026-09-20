import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { pengajuanStokApi, type FilterPengajuanStok } from "./api";

/** Daftar pengajuan stok; argumen null berarti cakupan belum siap, tanpa permintaan. */
export function useDaftarPengajuanStok(filter: FilterPengajuanStok | null) {
  return useQuery({
    queryKey: queryKeys.pengajuanStok.daftar({ ...filter }),
    queryFn: () => pengajuanStokApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
}