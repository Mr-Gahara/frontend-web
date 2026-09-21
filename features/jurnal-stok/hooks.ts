import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jurnalStokApi } from "./api";
import { filterServer, type LingkupJurnal } from "./filter";

/**
 * Daftar jurnal stok untuk sebuah lingkup. Argumen null berarti lingkup belum
 * siap (lokasi aktif masih dimuat atau gagal dimuat), sehingga tidak ada
 * permintaan.
 */
export function useDaftarJurnalStok(lingkup: LingkupJurnal | null) {
  const filter = lingkup ? filterServer(lingkup) : null;
  return useQuery({
    queryKey: queryKeys.jurnalStok.daftar({ ...filter }),
    queryFn: () => jurnalStokApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
}
