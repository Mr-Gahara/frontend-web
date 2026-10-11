/**
 * Pemanggilan API izin dan cuti. GET /izincuti memeriksa read-izin-cuti dan
 * mengirim seluruh izin tenant, terbaru lebih dulu, tanpa filter maupun
 * paginasi; backend menyimpan daftarnya 300 detik di cache.
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { IzinCuti } from "@/types/izinCuti";

export const izinCutiApi = {
  daftar: () => apiData.get<IzinCuti[]>(EP.izinCuti.list),
};