"use client";

/**
 * Hook data sesi booking.
 *
 * useDaftarSesiBooking memakai kunci sesiBooking.daftar(tanggal) (booking
 * yang mulai hari itu, panel venue dashboard), dan dengan opsi timeline
 * kunci sesiBooking.timeline(tanggal) (timeline reservasi, TL1a); buat
 * reservasi memakai kunci banyakTanggal (keputusan rancangan butir 12).
 * Perilaku muat ulang sama
 * dengan halaman lama: segar 1 menit, dimuat ulang saat halaman dibuka dan
 * saat jendela kembali difokus.
 * Catatan backend: void penjualan tidak membersihkan cache daftar per tanggal
 * (keputusan R3a), sehingga daftar dapat basi sampai 5 menit setelah void
 * walau frontend memuat ulang.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sesiBookingApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

export function useDaftarSesiBooking(tanggal: string, opsi: { timeline?: boolean } = {}) {
  return useQuery({
    queryKey: opsi.timeline ? queryKeys.sesiBooking.timeline(tanggal) : queryKeys.sesiBooking.daftar(tanggal),
    queryFn: () => (opsi.timeline ? sesiBookingApi.timeline(tanggal) : sesiBookingApi.daftar(tanggal)),
    staleTime: 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/**
 * Booking beberapa tanggal sekaligus, untuk mendeteksi bentrok di form buat
 * reservasi. Memakai tampilan=timeline (B327, TL1a), sehingga booking yang
 * mulai sehari sebelumnya dan melewati tengah malam ikut terbaca; booking yang
 * terbaca di dua tanggal disatukan per id. Kunci banyakTanggal berbeda dari
 * kunci timeline, dan dimuat ulang tiap menit, sama dengan halaman lama.
 */
export function useBookingBanyakTanggal(tanggal: string[]) {
  return useQuery({
    queryKey: queryKeys.sesiBooking.banyakTanggal(tanggal),
    queryFn: async () => {
      const semua = (await Promise.all(tanggal.map((t) => sesiBookingApi.timeline(t)))).flat();
      return [...new Map(semua.map((b) => [b.id, b])).values()];
    },
    enabled: tanggal.length > 0,
    refetchInterval: 60_000,
  });
}

/**
 * Buat booking. Penjualan dan aset diinvalidasi saat berhasil, karena booking
 * membuat penjualan dan status aset dihitung dari booking. Daftar booking
 * dimuat ulang juga saat gagal, agar penolakan bentrok 409 langsung terlihat
 * di form, sama dengan halaman lama.
 */
export function useBuatBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sesiBookingApi.buat,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.penjualan.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.aset.semua }),
      ]),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.sesiBooking.semua }),
  });
}

/**
 * Menandai booking Selesai lebih awal (keputusan NZ7a). Akar sesiBooking,
 * aset, dan penjualan diinvalidasi dan ditunggu: jadwalnya terbuka untuk
 * booking lain, status aset dihitung dari booking Aktif, dan detail
 * penjualan memuat statusnya lewat sesiBooking[] (B347).
 */
export function useTandaiSelesaiBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sesiBookingApi.tandaiSelesai,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sesiBooking.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.aset.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.penjualan.semua }),
      ]),
  });
}
