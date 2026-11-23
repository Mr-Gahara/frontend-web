import { apiClient } from "@/lib/apiClient";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { normalizeId } from "@/lib/api/normalize";
import type { BarisArusKas, LaporanArusKas, LaporanLabaRugiData, PembayaranPerMetode, RingkasanArusKas } from "@/types/laporan";
import type { RentangLaporan } from "./periode";
import type { FormatLaporan } from "@/lib/unduh";

export const laporanApi = {
  labaRugi: (rentang: RentangLaporan) =>
    apiData.get<LaporanLabaRugiData[]>(EP.laporan.labaRugi, { ...rentang }),

  /** Ringkasan ada di samping data pada envelope, sehingga dibaca langsung dari respons. */
  arusKas: async (params: Record<string, string>): Promise<LaporanArusKas> => {
    const res = await apiClient.get<{ data?: BarisArusKas[]; ringkasan?: RingkasanArusKas }>(
      EP.laporan.arusKas,
      params,
      "pengguna",
    );
    return { baris: normalizeId(res.data ?? []), ringkasan: normalizeId(res.ringkasan as RingkasanArusKas) };
  },

  /**
   * Uang diterima per metode dari endpoint laporannya sendiri (B353, P85);
   * sebelumnya dibaca dari ringkasan laba rugi (B329). periode tidak dipakai.
   */
  pembayaranPerMetode: ({ startDate, endDate }: RentangLaporan) =>
    apiData.get<PembayaranPerMetode[]>(EP.laporan.pembayaranPerMetode, { startDate, endDate }),

  unduhArusKas: (params: Record<string, string>) =>
    apiClient.unduh(EP.laporan.arusKas, params, `arus-kas_${params.startDate}_${params.endDate}.${params.format}`, "pengguna"),

  /** Ekspor laba rugi per periode, baris per periode lalu TOTAL (P85). */
  unduhLabaRugi: (rentang: RentangLaporan, format: FormatLaporan) =>
    apiClient.unduh(
      EP.laporan.labaRugi,
      { ...rentang, format },
      `laba-rugi_${rentang.startDate}_${rentang.endDate}.${format}`,
      "pengguna",
    ),

  /** Ekspor pembayaran per metode: Metode, Banyak Pembayaran, Jumlah (B353). */
  unduhPembayaranPerMetode: ({ startDate, endDate }: RentangLaporan, format: FormatLaporan) =>
    apiClient.unduh(
      EP.laporan.pembayaranPerMetode,
      { startDate, endDate, format },
      `pembayaran-per-metode_${startDate}_${endDate}.${format}`,
      "pengguna",
    ),
};
