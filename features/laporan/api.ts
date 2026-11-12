import { apiClient } from "@/lib/apiClient";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { normalizeId } from "@/lib/api/normalize";
import type { BarisArusKas, LaporanArusKas, LaporanLabaRugiData, RingkasanArusKas } from "@/types/laporan";
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

  unduhArusKas: (params: Record<string, string>) =>
    apiClient.unduh(EP.laporan.arusKas, params, `arus-kas_${params.startDate}_${params.endDate}.${params.format}`, "pengguna"),
};
