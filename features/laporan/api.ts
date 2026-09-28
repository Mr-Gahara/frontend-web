import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { LaporanLabaRugiData } from "@/types/laporan";
import type { RentangLaporan } from "./periode";

export const laporanApi = {
  labaRugi: (rentang: RentangLaporan) =>
    apiData.get<LaporanLabaRugiData[]>(EP.laporan.labaRugi, { ...rentang }),
};