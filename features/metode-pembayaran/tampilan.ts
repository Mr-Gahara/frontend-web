import type { AkunKas } from "@/types/akunKas";
import type { MetodePembayaran } from "@/types/metodePembayaran";

/** Batas metode aktif per toko di backend 465b438 (BATAS_METODE_AKTIF, keputusan PO3a). */
export const BATAS_METODE_AKTIF = 10;

export const labelKategori = (k: MetodePembayaran["kategori"]) => (k === "tunai" ? "Tunai" : "Non Tunai");

export const jumlahMetodeAktif = (daftar: readonly MetodePembayaran[]) =>
  daftar.filter((m) => m.isActive).length;

/** Metode aktif baru boleh dibuat atau diaktifkan selama belum mencapai batas (PO3a). */
export const masihDalamBatas = (daftar: readonly MetodePembayaran[]) =>
  jumlahMetodeAktif(daftar) < BATAS_METODE_AKTIF;

/**
 * Menonaktifkan metode aktif terakhir membuat kasir tanpa metode
 * pembayaran. Backend menolaknya 409 sejak nizar c29310c (butir 87), dan web
 * menahannya di menu daftar serta di form ubah (NZ4a, menggantikan PO5a).
 */
export const metodeAktifTerakhir = (daftar: readonly MetodePembayaran[], m: MetodePembayaran) =>
  m.isActive && jumlahMetodeAktif(daftar) === 1;

export type PilihanAkun = { id: string; label: string; aktif: boolean };

/**
 * Pilihan akun tujuan: akun aktif saja, ditambah akun metode ini bila sudah
 * nonaktif, bertanda "(nonaktif)" agar pengguna tahu harus memindahkannya
 * (sejalan PL1a).
 */
export function pilihanAkun(daftar: readonly AkunKas[], akunSekarang?: string): PilihanAkun[] {
  const hasil: PilihanAkun[] = daftar
    .filter((a) => a.status === "aktif")
    .map((a) => ({ id: a.id, label: `${a.namaAkun} (${a.nomorAkun})`, aktif: true }));
  const lama = akunSekarang ? daftar.find((a) => a.id === akunSekarang && a.status !== "aktif") : undefined;
  if (lama) hasil.push({ id: lama.id, label: `${lama.namaAkun} (${lama.nomorAkun}) (nonaktif)`, aktif: false });
  return hasil;
}