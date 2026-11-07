/**
 * Penerjemahan pesan kegagalan Mesin Kasir (keputusan rancangan butir 10).
 *
 * Hanya catatan wajib saat tutup kasir yang diterjemahkan, dengan teks dari
 * daftar periksa penyambungan. Tutup menjawab 400 untuk catatan wajib, akun
 * nonaktif, dan validator, sehingga kasusnya dikenali dari teks pesan
 * services/sesiKasirService.js backend ridho 1584222, bukan dari status
 * saja. Pesan lain, termasuk 409 dan 404 saat menyimpan atau melepas mesin
 * kasir, diteruskan apa adanya dari backend (keputusan pemilik proyek,
 * 7 November 2026; MK14b di modul/keuangan.md).
 */

import { isApiError, pesanError } from "@/lib/api/error";

export const PESAN_CATATAN_WAJIB =
  "Hitungan berbeda dengan catatan sistem. Tulis catatan penyebabnya, lalu tutup lagi.";

const catatanWajib = (err: unknown): boolean =>
  isApiError(err) &&
  err.status === 400 &&
  `${err.message} ${err.errors.join(" ")}`.includes("catatan wajib diisi");

/** Gagal tambah atau ubah mesin kasir (POST /sesikasir/perangkat). */
export const pesanSimpanMesin = (err: unknown): string => pesanError(err, "Mesin kasir gagal disimpan.");

/** Gagal berhenti jadi mesin kasir (DELETE /sesikasir/perangkat/:id). */
export const pesanHapusMesin = (err: unknown): string => pesanError(err, "Mesin kasir gagal dilepas.");

/** Gagal tutup kasir dari web (POST /sesikasir/:id/tutup). */
export const pesanTutupKasir = (err: unknown): string =>
  catatanWajib(err) ? PESAN_CATATAN_WAJIB : pesanError(err, "Kasir gagal ditutup.");
