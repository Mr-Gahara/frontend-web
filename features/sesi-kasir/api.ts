import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type {
  PerangkatKasir,
  PerangkatToko,
  PeriodeKasir,
  PeriodeKasirDetail,
  PeriodeSesiTutup,
  SesiKasir,
} from "@/types/sesiKasir";
import type { PayloadMesinKasir } from "./dialog-mesin-kasir";
import type { PayloadTutupKasir } from "./dialog-tutup-kasir";

export type HalamanSesiKasir = { data: SesiKasir[]; pagination: Paginasi | null };
export type HalamanPeriodeKasir = { data: PeriodeKasir[]; pagination: Paginasi | null };

/**
 * Respons tutup (mapSesiKasirButa): tanpa angka (hitung buta), ditambah periode
 * struk tempat sesi bergabung (B376). periode null untuk sesi sebelum AR48.
 */
export type HasilTutupKasir = Pick<SesiKasir, "id" | "status" | "periodeKasirID"> & {
  periode?: PeriodeSesiTutup | null;
};

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
    apiData.post<HasilTutupKasir>(EP.sesiKasir.tutup(id), payload),

  daftarPerangkat: () => apiData.get<PerangkatKasir[]>(EP.sesiKasir.perangkat),
  /** Upsert per installationId: tambah dan ubah memakai endpoint yang sama. */
  simpanPerangkat: (payload: PayloadMesinKasir) =>
    apiData.post<PerangkatKasir>(EP.sesiKasir.perangkat, payload),
  hapusPerangkat: (id: string) => apiData.delete<unknown>(EP.sesiKasir.perangkatById(id)),

  /** Perangkat trusted se-toko untuk pilihan mesin kasir (B334). */
  perangkatToko: () => apiData.get<PerangkatToko[]>(EP.sesiKasir.perangkatToko),

  /**
   * Daftar periode laporan tutup kasir (B375), selalu berhalaman, terbaru di
   * atas. Query yang diterima: status, locationID, dari, sampai, page, limit.
   */
  daftarPeriode: async (params: Record<string, string>): Promise<HalamanPeriodeKasir> => {
    const hasil = await api.get<PeriodeKasir[]>(EP.sesiKasir.periode, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  /** Detail periode beserta laporan; laporan null selama periode BUKA. */
  detailPeriode: (id: string) => apiData.get<PeriodeKasirDetail>(EP.sesiKasir.periodeById(id)),
};
