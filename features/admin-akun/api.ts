import { apiData, apiMentah } from "@/lib/api/client";
import { normalizeId } from "@/lib/api/normalize";
import { EP } from "@/lib/api/endpoints";
import type {
  AkunAdmin,
  AktifkanPayload,
  BekukanPayload,
  BuatAkunKlienPayload,
  HalamanRiwayat,
  PerbaruiAkunPayload,
  PerpanjangPayload,
  RiwayatLangganan,
} from "@/types/adminAkun";

interface ResponsRiwayat {
  data?: RiwayatLangganan[];
  cursorBerikutnya?: string | null;
}

/** Seluruh endpoint admin memakai token akun (authAkun dan adminOnly di backend). */
export const adminAkunApi = {
  daftar: () => apiData.get<AkunAdmin[]>(EP.akun.adminDaftar, undefined, "akun"),
  buat: (payload: BuatAkunKlienPayload) =>
    apiData.post<AkunAdmin>(EP.akun.adminAkun, payload, "akun"),
  bekukan: (id: string, payload: BekukanPayload) =>
    apiData.post<AkunAdmin>(EP.akun.adminBekukan(id), payload, "akun"),
  aktifkan: (id: string, payload: AktifkanPayload) =>
    apiData.post<AkunAdmin>(EP.akun.adminAktifkan(id), payload, "akun"),
  perpanjang: (id: string, payload: PerpanjangPayload) =>
    apiData.post<AkunAdmin>(EP.akun.adminLangganan(id), payload, "akun"),
  /**
   * Riwayat berkursor: cursorBerikutnya berada di tingkat atas respons,
   * sehingga dibaca lewat apiMentah, lalu _id dokumennya dinormalkan di sini.
   */
  riwayat: async (id: string, cursor?: string): Promise<HalamanRiwayat> => {
    const mentah = await apiMentah.get<ResponsRiwayat>(
      EP.akun.adminLangganan(id),
      cursor ? { cursor } : undefined,
      "akun",
    );
    return {
      data: normalizeId(mentah.data ?? []),
      cursorBerikutnya: mentah.cursorBerikutnya ?? null,
    };
  },
  /** Respons PUT tanpa langganan dan tanpa toko, sehingga tidak dipakai; daftar dimuat ulang. */
  perbarui: (id: string, payload: PerbaruiAkunPayload) =>
    apiData.put<unknown>(EP.akun.adminAkunDetail(id), payload, "akun"),
  /** Backend memverifikasi password admin dari body, dan hanya menghapus akun non-aktif. */
  hapus: (id: string, password: string) =>
    apiData.delete<unknown>(EP.akun.adminAkunDetail(id), "akun", { password }),
};