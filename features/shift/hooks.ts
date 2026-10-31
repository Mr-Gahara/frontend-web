"use client";

/**
 * Hook data master shift.
 *
 * useDaftarShift memakai kunci daftar dengan filter ruang. Mutation
 * menginvalidasi akar shift, pola roster, dan jadwal shift, karena pola
 * roster dan kalender jadwal menampilkan nama dan jam shift. Daftar dan
 * simpan memakai lokasi ruang (B168, keputusan SH1b).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shiftApi } from "./api";
import { payloadShift } from "./payload";
import { filterDaftarShift, type RuangShift } from "./ruang";
import type { NilaiFormShift } from "./schema";
import { useLokasiRuang, type LokasiRuang } from "@/features/inventaris/hooks";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Lokasi ruang untuk memisahkan shift: outlet tenant untuk ruang outlet, dan
 * lokasi Gudang pertama untuk ruang gudang (model MVP). Lokasi yang sudah
 * termuat tetapi tidak ada dianggap gagal, agar halaman tidak menampilkan
 * daftar kosong seolah-olah belum ada shift.
 */
function useLokasiRuangShift(ruang: RuangShift): LokasiRuang {
  return useLokasiRuang(ruang);
}

export function useDaftarShift(ruang: RuangShift) {
  const lokasi = useLokasiRuangShift(ruang);
  const filter = filterDaftarShift(lokasi.lokasiId);
  const kueri = useQuery({
    queryKey: queryKeys.shift.daftar(filter ?? undefined),
    queryFn: () => shiftApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
  return {
    data: kueri.data ?? [],
    memuat: lokasi.memuat || kueri.isLoading,
    gagal: lokasi.gagal || kueri.isError,
  };
}

function useInvalidasiShift() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.shift.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.polaRoster.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jadwalShift.semua }),
    ]);
}

export function useSimpanShift(ruang: RuangShift) {
  const lokasi = useLokasiRuangShift(ruang);
  const invalidasi = useInvalidasiShift();
  return useMutation({
    mutationFn: ({ id, nilai }: { id?: string; nilai: NilaiFormShift }) => {
      const payload = payloadShift(nilai, lokasi.lokasiId);
      return id ? shiftApi.perbarui(id, payload) : shiftApi.buat(payload);
    },
    onSuccess: invalidasi,
  });
}

export function useNonaktifkanShift() {
  const invalidasi = useInvalidasiShift();
  return useMutation({
    mutationFn: shiftApi.nonaktifkan,
    onSuccess: invalidasi,
  });
}