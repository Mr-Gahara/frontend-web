"use client";

/**
 * Hook data sesi booking.
 *
 * useDaftarSesiBooking memakai kunci sesiBooking.daftar(tanggal), yang hanya
 * diisi halaman daftar reservasi; buat reservasi lama memakai kunci
 * banyakTanggal (keputusan rancangan butir 12). Perilaku muat ulang sama
 * dengan halaman lama: segar 1 menit, dimuat ulang saat halaman dibuka dan
 * saat jendela kembali difokus.
 * Catatan backend: void penjualan tidak membersihkan cache daftar per tanggal
 * (keputusan R3a), sehingga daftar dapat basi sampai 5 menit setelah void
 * walau frontend memuat ulang.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sesiBookingApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

export function useDaftarSesiBooking(tanggal: string) {
  return useQuery({
    queryKey: queryKeys.sesiBooking.daftar(tanggal),
    queryFn: () => sesiBookingApi.daftar(tanggal),
    staleTime: 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/**
 * Booking beberapa tanggal sekaligus, untuk mendeteksi bentrok di form buat
 * reservasi. Kunci banyakTanggal berbeda dari daftar(tanggal) milik timeline,
 * dan dimuat ulang tiap menit, sama dengan halaman lama.
 */
export function useBookingBanyakTanggal(tanggal: string[]) {
  return useQuery({
    queryKey: queryKeys.sesiBooking.banyakTanggal(tanggal),
    queryFn: async () => (await Promise.all(tanggal.map((t) => sesiBookingApi.daftar(t)))).flat(),
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

/** Detail satu booking (NZ7a). Selalu dimuat ulang saat dibuka, karena statusnya berubah lewat pembayaran dan jam. */
export function useSesiBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.sesiBooking.detail(id),
    queryFn: () => sesiBookingApi.detail(id),
    enabled: id !== "",
    staleTime: 0,
  });
}

/**
 * Menandai booking Selesai lebih awal (keputusan NZ7a). Akar sesiBooking dan
 * aset diinvalidasi dan ditunggu: jadwalnya terbuka untuk booking lain, dan
 * status aset dihitung dari booking Aktif.
 */
export function useTandaiSelesaiBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sesiBookingApi.tandaiSelesai,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sesiBooking.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.aset.semua }),
      ]),
  });
}
