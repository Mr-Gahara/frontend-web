"use client";

/**
 * Hook panel dashboard gudang. Masing-masing dipanggil dari panel yang hanya
 * dipasang bila izinnya dipegang (izin.ts), sehingga tidak perlu saklar aktif.
 * Bentuk kembaliannya seragam: data, memuat, gagal, ulangi.
 */
import { useQuery } from "@tanstack/react-query";

import { useDaftarInventory, useLokasiBertipe } from "@/features/inventaris/hooks";
import { useHalamanJurnalStok } from "@/features/jurnal-stok/hooks";
import { queryKeys } from "@/lib/queryKeys";
import { dashboardGudangApi } from "./api";
import { BATAS_BARIS, antreanDariRingkasan, jurnalTerbaruGudang, stokKritis } from "./ringkasan";

/** Hitungan surat jalan; filternya sama dengan tab Belum Dikirim dan halaman pengiriman. */
export function useRingkasanPengiriman() {
  const kueri = useQuery({
    queryKey: queryKeys.transferStok.ringkasanGudang(),
    queryFn: dashboardGudangApi.ringkasan,
    select: (r) => r.transfer,
  });
  return {
    data: kueri.data ?? null,
    memuat: kueri.isLoading,
    gagal: kueri.isError,
    ulangi: () => void kueri.refetch(),
  };
}

/**
 * Kartu pengajuan, dari ringkasan yang sama dengan kartu surat jalan: satu
 * permintaan untuk kedua kelompok. Aksi pengajuan ikut menginvalidasi kuncinya
 * (features/pengajuan-stok/hooks.ts).
 */
export function useAntreanPengajuan() {
  const kueri = useQuery({
    queryKey: queryKeys.transferStok.ringkasanGudang(),
    queryFn: dashboardGudangApi.ringkasan,
    select: antreanDariRingkasan,
  });
  return {
    data: kueri.data ?? null,
    memuat: kueri.isLoading,
    gagal: kueri.isError,
    ulangi: () => void kueri.refetch(),
  };
}

/** Stok kritis di gudang (MVP: satu gudang per tenant, lokasi bertipe Gudang yang pertama). */
export function useStokKritisGudang() {
  const gudang = useLokasiBertipe("Gudang");
  const inventori = useDaftarInventory(gudang.lokasiId ? { locationID: gudang.lokasiId } : null);
  return {
    data: inventori.data ? stokKritis(inventori.data) : null,
    memuat: gudang.isLoading || inventori.isLoading,
    gagal: gudang.isError || inventori.isError,
    ulangi: () => void (gudang.isError ? gudang.refetch() : inventori.refetch()),
  };
}

/**
 * Lima jurnal terbaru di gudang (MVP: lokasi bertipe Gudang yang pertama).
 * Server menyaring lokasi dan memotong lima baris; jurnalTerbaruGudang tetap
 * menjaga tipe lokasi dan urutannya di klien.
 */
export function useJurnalTerbaruGudang() {
  const gudang = useLokasiBertipe("Gudang");
  const kueri = useHalamanJurnalStok(
    gudang.lokasiId ? { lokasiID: gudang.lokasiId, arah: "ALL", alasan: "ALL" } : null,
    1,
    BATAS_BARIS,
  );
  return {
    data: kueri.data ? jurnalTerbaruGudang(kueri.data.data) : null,
    memuat: gudang.isLoading || kueri.isLoading,
    gagal: gudang.isError || kueri.isError,
    ulangi: () => void (gudang.isError ? gudang.refetch() : kueri.refetch()),
  };
}