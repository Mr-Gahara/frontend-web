import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { PerangkatKasir, PerangkatPengguna, SesiKasir } from "@/types/sesiKasir";
import type { PayloadMesinKasir } from "./dialog-mesin-kasir";
import type { PayloadTutupKasir } from "./dialog-tutup-kasir";

export type HalamanSesiKasir = { data: SesiKasir[]; pagination: Paginasi | null };

export const sesiKasirApi = {
  /**
   * Daftar sesi, selalu per halaman (bacaPaginasiWajib: tanpa limit hanya 20
   * baris). Parameter yang diterima: status, installationId, dari, sampai,
   * page, dan limit; parameter lain ditolak 400.
   */
  daftar: async (params: Record<string, string>): Promise<HalamanSesiKasir> => {
    const hasil = await api.get<SesiKasir[]>(EP.sesiKasir.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  /** Detail beserta ringkasan tunai selama sesi. */
  detail: (id: string) => apiData.get<SesiKasir>(EP.sesiKasir.detail(id)),
  /**
   * Tutup dari web (kelola-perangkat-kasir). Responsnya tanpa angka (hitung
   * buta), sehingga detail dimuat ulang lewat invalidasi.
   */
  tutup: (id: string, payload: PayloadTutupKasir) =>
    apiData.post<unknown>(EP.sesiKasir.tutup(id), payload),

  daftarPerangkat: () => apiData.get<PerangkatKasir[]>(EP.sesiKasir.perangkat),
  /** Upsert per installationId: tambah dan ubah memakai endpoint yang sama. */
  simpanPerangkat: (payload: PayloadMesinKasir) =>
    apiData.post<PerangkatKasir>(EP.sesiKasir.perangkat, payload),
  hapusPerangkat: (id: string) => apiData.delete<unknown>(EP.sesiKasir.perangkatById(id)),

  /**
   * Perangkat login satu pengguna. Ditolak 403 bila level role peminta tidak
   * di atas level pengguna itu (deviceService.getDevices), kecuali milik
   * sendiri.
   */
  perangkatPengguna: (userId: string) =>
    apiData.get<PerangkatPengguna[]>(EP.devicePengguna(userId)),
};
