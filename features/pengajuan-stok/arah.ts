import type { PengajuanStok } from "@/types/pengajuanStok";

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