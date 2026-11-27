import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { SesiBookingResponse } from "@/types/sesiBooking";
import type { SesiKasir } from "@/types/sesiKasir";
import type { PengajuanStok } from "@/types/pengajuanStok";
import type { Diskon } from "@/types/diskon";
import type { Membership } from "@/types/membership";

/** Hitungan per status untuk satu arah (permintaan ke outlet, pengembalian dari outlet). */
type HitunganArah<K extends string> = Record<K, number>;

/**
 * Ringkasan GET /dashboard/outlet (dashboardGudangService.getOutletSummary,
 * backend 1718030). Pengajuan: draft, menungguApproval, dan disetujui yang
 * belum punya surat jalan; transfer: sedangDikirim dan sudahDiterima; stok
 * kritis bahan di outlet dan produk berstok langsung; produk.total dan
 * produk.dapatDijual (stok terhitung resep) sejak B380, pemicu LN1a (PW07).
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
  produk: { stokKritis: number; total: number; dapatDijual: number };
}

/** Jumlah baris sebuah daftar berhalaman: satu baris diminta, angkanya dari pagination.total. */
async function hitung(endpoint: string, params: Record<string, string>): Promise<number> {
  const hasil = await api.get<unknown[]>(endpoint, { ...params, page: "1", limit: "1" });
  return hasil.pagination?.total ?? hasil.data.length;
}

/**
 * Perangkat menunggu persetujuan (B381, mapDeviceResponse): milik pengguna
 * se-toko berlevel di bawah peminta (P39), terbaru dulu.
 */
export interface PerangkatMenunggu {
  id: string;
  installationId: string;
  deviceName: string | null;
  pengguna: { id: string; nama: string; status: string; level?: number } | null;
  createdAt: string;
}

export const notifikasiApi = {
  /**
   * Daftar utuh tanpa paginasi. apiData memakai token pengguna secara
   * eksplisit; pola "/device/" di determineTokenKey tidak cocok untuk
   * "/device?status=pending".
   */
  perangkatMenunggu: () => apiData.get<PerangkatMenunggu[]>(EP.perangkatMenunggu, { status: "pending" }),
  ringkasanOutlet: () => apiData.get<RingkasanOutlet>(EP.dashboardOutlet),
  /** Stock opname menunggu ditinjau di satu tipe lokasi (status SUBMITTED). */
  opnameMenunggu: (tipeLokasi: "Outlet" | "Gudang") =>
    hitung(EP.stockOpname.list, { status: "SUBMITTED", tipeLokasi }),
  /** Bahan di gudang yang mencapai stok minimum (stokKritis disaring server). */
  stokKritisLokasi: (locationID: string) => hitung(EP.inventory.list, { locationID, stokKritis: "true" }),
  /** Sesi kasir yang masih terbuka, terbaru lebih dulu (paginasi wajib backend). */
  sesiKasirBuka: async () => (await api.get<SesiKasir[]>(EP.sesiKasir.list, { status: "BUKA", page: "1", limit: "20" })).data,
  /** Booking yang dimulai pada tanggal lokal YYYY-MM-DD. */
  bookingHari: (tanggal: string) => apiData.get<SesiBookingResponse[]>(EP.sesiBooking.list, { tanggal }),
  /**
   * Pengajuan yang sudah diputuskan, 20 terbaru menurut createdAt (urutan
   * backend). Backend membuang status di luar hak pengguna (statusTerlihat).
   */
  pengajuanDiputuskan: async () =>
    (
      await api.get<PengajuanStok[]>(EP.pengajuanStok.list, {
        status: "APPROVED,PENDING,COMPLETED,REJECTED",
        page: "1",
        limit: "20",
      })
    ).data,
  /** Jumlah penjualan berstatus UNPAID atau PARTIAL (filter statusPenjualan backend). */
  penjualanBerstatus: (statusPenjualan: "UNPAID" | "PARTIAL") => hitung(EP.penjualan.list, { statusPenjualan }),
  /** Membership berstatus Aktif (tanpa paginasi: seluruhnya). */
  membershipAktif: () => apiData.get<Membership[]>(EP.membership.list, { status: "Aktif" }),
  /** Diskon berstatus Aktif. */
  diskonAktif: () => apiData.get<Diskon[]>(EP.diskon.list, { status: "Aktif" }),
};
