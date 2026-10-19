"use client";

/**
 * Hook panel dashboard gudang. Masing-masing dipanggil dari panel yang hanya
 * dipasang bila izinnya dipegang (izin.ts), sehingga tidak perlu saklar aktif.
 * Bentuk kembaliannya seragam: data, memuat, gagal, ulangi.
 */
import { useQuery } from "@tanstack/react-query";

import { useDaftarInventory, useLokasiBertipe } from "@/features/inventaris/hooks";
import { useDaftarJurnalStok } from "@/features/jurnal-stok/hooks";
import { useDaftarPengajuanStok } from "@/features/pengajuan-stok/hooks";
import { queryKeys } from "@/lib/queryKeys";
import { dashboardGudangApi } from "./api";
import { hitungAntreanPengajuan, jurnalTerbaruGudang, stokKritis } from "./ringkasan";

/** Hitungan surat jalan; filternya sama dengan tab DRAFT SJ dan halaman pengiriman. */
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

/** Kartu pengajuan. Kuncinya sama dengan tab Semua daftar pengajuan gudang, sehingga cache dipakai bersama. */
export function useAntreanPengajuan() {
  const kueri = useDaftarPengajuanStok({});
  return {
    data: kueri.data ? hitungAntreanPengajuan(kueri.data) : null,
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

/** Lima jurnal terbaru lokasi bertipe Gudang. */
export function useJurnalTerbaruGudang() {
  const kueri = useDaftarJurnalStok({ tipeLokasi: "Gudang" });
  return {
    data: kueri.data ? jurnalTerbaruGudang(kueri.data) : null,
    memuat: kueri.isLoading,
    gagal: kueri.isError,
    ulangi: () => void kueri.refetch(),
  };
}