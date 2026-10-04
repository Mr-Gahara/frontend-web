import { IZIN_DASAR, IZIN_TERLARANG } from "./constants";
import type { Permission } from "@/types/role";

/** Bagian detail role yang dibaca form; izin dapat berupa nama atau objek. */
export interface SumberNilaiAwalRole {
  namaRole?: string | null;
  deskripsi?: string | null;
  level?: number;
  permissions?: readonly (string | Permission)[] | null;
}

export interface NilaiAwalRole {
  namaRole: string;
  deskripsi: string;
  /** Level sebagai teks, karena isiannya berupa input teks. */
  level: string;
  /** Wewenang yang tampil dan dapat dicentang. */
  izinTerpilih: string[];
  /**
   * Wewenang terlarang yang sudah dimiliki posisi ini: tidak ditampilkan,
   * tetapi tetap dikirim saat simpan agar tidak hilang.
   */
  izinTersembunyi: string[];
}

/**
 * Nilai awal form role. Tanpa detail (membuat posisi baru), wewenang dasar
 * sudah terpilih; dengan detail (mengubah), nilainya dari posisi itu.
 */
export function nilaiAwalRole(
  detail?: SumberNilaiAwalRole | null,
): NilaiAwalRole {
  if (!detail) {
    return {
      namaRole: "",
      deskripsi: "",
      level: "",
      izinTerpilih: [...IZIN_DASAR],
      izinTersembunyi: [],
    };
  }

  const namaIzin = (detail.permissions ?? []).map((p) =>
    typeof p === "object" ? p.nama : p,
  );

  return {
    namaRole: detail.namaRole || "",
    deskripsi: detail.deskripsi || "",
    level: detail.level !== undefined ? String(detail.level) : "",
    izinTerpilih: namaIzin.filter((p) => !IZIN_TERLARANG.includes(p)),
    izinTersembunyi: namaIzin.filter((p) => IZIN_TERLARANG.includes(p)),
  };
}