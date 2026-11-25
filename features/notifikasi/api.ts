import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Produk } from "@/types/produk";

/** Hitungan per status untuk satu arah (permintaan ke outlet, pengembalian dari outlet). */
type HitunganArah<K extends string> = Record<K, number>;

/**
 * Ringkasan GET /dashboard/outlet (dashboardGudangService.getOutletSummary,
 * backend 1718030). Pengajuan: draft, menungguApproval, dan disetujui yang
 * belum punya surat jalan; transfer: sedangDikirim dan sudahDiterima; stok
 * kritis bahan di outlet dan produk berstok langsung.
 */
export interface RingkasanOutlet {
  outlet: { id: string; nama: string } | null;
  pengajuan: HitunganArah<"draft" | "menungguApproval" | "disetujui"> & {
    perArah: Record<"permintaan" | "pengembalian", HitunganArah<"draft" | "menungguApproval" | "disetujui">>;
  };
  transfer: HitunganArah<"sedangDikirim" | "sudahDiterima"> & {
    perArah: Record<"permintaan" | "pengembalian", HitunganArah<"sedangDikirim" | "sudahDiterima">>;
  };
  inventory: { stokKritis: number };
  produk: { stokKritis: number };
}

export const notifikasiApi = {
  ringkasanOutlet: () => apiData.get<RingkasanOutlet>(EP.dashboardOutlet),
  /** Seluruh produk tanpa paginasi: satu-satunya respons yang mengisi stok terhitung produk beresep (LN8a). */
  produk: () => apiData.get<Produk[]>(EP.produk.list),
};
