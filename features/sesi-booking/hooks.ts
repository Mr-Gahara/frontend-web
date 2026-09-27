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

import { useQuery } from "@tanstack/react-query";
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