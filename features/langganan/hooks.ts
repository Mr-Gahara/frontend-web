"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { langgananApi } from "./api";

export function useLanggananToko() {
  return useQuery({ queryKey: queryKeys.langganan.toko(), queryFn: langgananApi.toko });
}

/** Riwayat bertahap lewat kursor backend, seperti riwayat di panel admin (PA11a). */
export function useRiwayatLanggananToko() {
  return useInfiniteQuery({
    queryKey: queryKeys.langganan.riwayat(),
    queryFn: ({ pageParam }) => langgananApi.riwayat(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (terakhir) => terakhir.cursorBerikutnya,
  });
}
