import type { PengajuanStok } from "@/types/pengajuanStok";
import type { RuangPengajuan } from "./filter";

/**
 * Arah perpindahan barang menurut P8 backend: dariLocationID adalah asal
 * barang dan keLocationID tujuannya, bukan pihak yang meminta. Pengajuan
 * hanya sah antara Gudang dan Outlet, ke dua arah: gudang mengirim ke outlet
 * (permintaan), dan outlet mengembalikan ke gudang (pengembalian). Pasangan
 * lain ditolak periksaArahLokasi saat buat, ubah lokasi, dan setujui
 * (pengajuanStokService.js baris 52 sampai 57, backend ridho b5b367a).
 */
export type ArahPengajuan = "GUDANG_KE_OUTLET" | "OUTLET_KE_GUDANG";

type LokasiBertipe = { tipe: string | null } | null;

/** Arah dari tipe lokasi asal dan tujuan; null untuk pasangan lain atau lokasi yang tidak termuat. */
export function arahLokasi(dari: LokasiBertipe, ke: LokasiBertipe): ArahPengajuan | null {
  if (dari?.tipe === "Gudang" && ke?.tipe === "Outlet") return "GUDANG_KE_OUTLET";
  if (dari?.tipe === "Outlet" && ke?.tipe === "Gudang") return "OUTLET_KE_GUDANG";
  return null;
}

/**
 * Peran sebuah ruang dalam perpindahan barang (AR1a dan AR2a): ruang yang
 * bertipe sama dengan asal barang adalah pengirim, yang membuat, mengirim,
 * dan membatalkan surat jalan; ruang tujuan adalah penerima.
 */
export function peranRuang(arah: ArahPengajuan, ruang: RuangPengajuan): "pengirim" | "penerima" {
  const asal: RuangPengajuan = arah === "GUDANG_KE_OUTLET" ? "gudang" : "outlet";
  return ruang === asal ? "pengirim" : "penerima";
}

/**
 * Arah lokasi pengajuan stok menurut backend: dariLocationID adalah gudang
 * asal barang dan keLocationID adalah outlet peminta. Surat jalan menyalin
 * arah ini (transferStokService baris 143 dan 144), lalu kirim mengurangi
 * stok di dariLocationID dan terima menambah stok di keLocationID.
 *
 * Backend belum memeriksa tipe kedua lokasi, sehingga pengajuan yang
 * terbalik tersimpan tanpa penolakan dan akan menggerakkan stok ke arah yang
 * salah bila disetujui dan dibuatkan surat jalan. Pengajuan seperti itu tidak
 * tampil di daftar dan tindakannya dikunci di detail gudang.
 */
export function arahPengajuanValid(p: Pick<PengajuanStok, "dariLokasi" | "keLokasi">): boolean {
  return p.dariLokasi?.tipe === "Gudang" && p.keLokasi?.tipe === "Outlet";
}