/**
 * Pemanggilan API izin dan cuti. GET /izincuti memeriksa read-izin-cuti dan
 * mengirim izin tenant, terbaru lebih dulu, tanpa paginasi. Query opsional
 * (B160): status, serta dari dan sampai (hari WIB, YYYY-MM-DD); izin masuk
 * bila masanya bersinggungan dengan periode. Query lain dijawab 400.
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { IzinCuti, StatusIzinCuti } from "@/types/izinCuti";

export interface FilterIzinCuti {
  status?: StatusIzinCuti;
  dari?: string;
  sampai?: string;
}

export const izinCutiApi = {
  daftar: (filter: FilterIzinCuti = {}) =>
    apiData.get<IzinCuti[]>(EP.izinCuti.list, { ...filter }),
};