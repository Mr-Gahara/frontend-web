"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { langgananApi } from "./api";

/** aktif false bagi pengguna tanpa read-langganan, misalnya lonceng topbar. */
export function useLanggananToko(aktif = true) {
  return useQuery({ queryKey: queryKeys.langganan.toko(), queryFn: langgananApi.toko, enabled: aktif });
}

/** Riwayat bertahap lewat kursor backend, seperti riwayat di panel admin (PA11a). */
export function useRiwayatLanggananToko(aktif = true) {
  return useInfiniteQuery({
    enabled: aktif,
    queryKey: queryKeys.langganan.riwayat(),
    queryFn: ({ pageParam }) => langgananApi.riwayat(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (terakhir) => terakhir.cursorBerikutnya,
  });
}
