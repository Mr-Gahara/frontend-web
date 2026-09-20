import type { PengajuanStok } from "@/types/pengajuanStok";

export type RuangPengajuan = "outlet" | "gudang";

/**
 * Penyaringan daftar pengajuan di klien, per ruang.
 * - Outlet: hanya pengajuan dari lokasi bertipe Outlet; pencarian nomor.
 * - Gudang: hanya pengajuan ke lokasi bertipe Gudang dan bukan draf, karena
 *   draf belum diajukan dan belum menjadi urusan gudang; pencarian nomor dan
 *   nama outlet asal.
 */
export function saringPengajuan(data: PengajuanStok[], ruang: RuangPengajuan, kata: string): PengajuanStok[] {
  const cari = kata.trim().toLowerCase();
  return data.filter((p) => {
    const cocokNomor = p.nomorPengajuan.toLowerCase().includes(cari);
    if (ruang === "outlet") {
      return p.dariLokasi?.tipe === "Outlet" && (!cari || cocokNomor);
    }
    if (p.keLokasi?.tipe !== "Gudang" || p.status === "DRAFT") return false;
    return !cari || cocokNomor || (p.dariLokasi?.nama ?? "").toLowerCase().includes(cari);
  });
}