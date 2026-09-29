"use client";

/**
 * Hook data pola roster.
 *
 * useDaftarPolaRoster memakai kunci daftar dengan filter ruang, bukan akar
 * polaRoster.semua yang dipakai halaman generate lama untuk menyimpan data
 * (keputusan rancangan butir 3). Mutation menunggu invalidasi akar pola
 * roster, sehingga dialog tertutup setelah daftar termuat ulang. Perilaku
 * backend yang tidak diakali (butir 17): ubah pola roster selalu gagal,
 * karena validator model memakai this.siklusHari di findOneAndUpdate.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { polaRosterApi } from "./api";
import { tambahLokasiPolaRoster } from "./payload";
import { filterDaftarPola, polaTerpisahPerRuang, type RuangPolaRoster } from "./ruang";
import { useLokasiRuang } from "@/features/inventaris/hooks";
import { queryKeys } from "@/lib/queryKeys";
import type { PolaRosterRequest } from "@/types/pola-roster";

export function useDaftarPolaRoster(ruang: RuangPolaRoster) {
  const lokasi = useLokasiRuang(ruang, { aktif: polaTerpisahPerRuang() });
  const filter = filterDaftarPola(lokasi.lokasiId);
  const kueri = useQuery({
    queryKey: queryKeys.polaRoster.daftar(filter ?? undefined),
    queryFn: () => polaRosterApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
  return {
    data: kueri.data ?? [],
    memuat: lokasi.memuat || kueri.isLoading,
    gagal: lokasi.gagal || kueri.isError,
  };
}

function useInvalidasiPolaRoster() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.polaRoster.semua });
}

export function useSimpanPolaRoster(ruang: RuangPolaRoster) {
  const lokasi = useLokasiRuang(ruang, { aktif: polaTerpisahPerRuang() });
  const invalidasi = useInvalidasiPolaRoster();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: PolaRosterRequest }) => {
      const kirim = tambahLokasiPolaRoster(payload, lokasi.lokasiId);
      return id ? polaRosterApi.perbarui(id, kirim) : polaRosterApi.buat(kirim);
    },
    onSuccess: invalidasi,
  });
}

export function useHapusPolaRoster() {
  const invalidasi = useInvalidasiPolaRoster();
  return useMutation({
    mutationFn: polaRosterApi.hapus,
    onSuccess: invalidasi,
  });
}