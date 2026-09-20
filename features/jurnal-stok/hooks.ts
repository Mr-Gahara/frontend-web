import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jurnalStokApi } from "./api";

export function useDaftarJurnalStok() {
  return useQuery({
    queryKey: queryKeys.jurnalStok.daftar(),
    queryFn: jurnalStokApi.daftar,
  });
}