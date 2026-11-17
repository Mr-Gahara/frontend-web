import { apiClient } from "@/lib/apiClient";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { normalizeId } from "@/lib/api/normalize";
import type { BarisArusKas, LaporanArusKas, LaporanLabaRugiData, PembayaranPerMetode, RingkasanArusKas } from "@/types/laporan";
import type { RentangLaporan } from "./periode";

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

  /** Uang diterima per metode (B329) dari ringkasan laba rugi; barisnya tidak dipakai. */
  pembayaranPerMetode: async (rentang: RentangLaporan): Promise<PembayaranPerMetode[]> => {
    const res = await apiClient.get<{ ringkasan?: { pembayaranPerMetode?: PembayaranPerMetode[] } }>(
      EP.laporan.labaRugi,
      { ...rentang },
      "pengguna",
    );
    return res.ringkasan?.pembayaranPerMetode ?? [];
  },

  unduhArusKas: (params: Record<string, string>) =>
    apiClient.unduh(EP.laporan.arusKas, params, `arus-kas_${params.startDate}_${params.endDate}.${params.format}`, "pengguna"),
};
