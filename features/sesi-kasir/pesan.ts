/**
 * Penerjemahan pesan kegagalan Mesin Kasir (keputusan rancangan butir 10).
 *
 * Backend menulis "perangkat" dan "akun kas", sedangkan layar memakai "mesin
 * kasir" dan "laci" (MK1a, modul/keuangan.md). Kasus dikenali dari status
 * beserta teks pesan services/sesiKasirService.js backend ridho 1584222,
 * karena satu status dipakai beberapa penolakan: tutup menjawab 400 untuk
 * catatan wajib, akun nonaktif, dan validator. Pesan lain diteruskan apa
 * adanya.
 */

import { isApiError, pesanError } from "@/lib/api/error";

export const PESAN_CATATAN_WAJIB =
  "Hitungan berbeda dengan catatan sistem. Tulis catatan penyebabnya, lalu tutup lagi.";

interface Kasus {
  status: number;
  teks: string;
  pesan: string;
}

const cocok = (err: unknown, daftar: readonly Kasus[]): string | null => {
  if (!isApiError(err)) return null;
  const teks = `${err.message} ${err.errors.join(" ")}`;
  return daftar.find((k) => k.status === err.status && teks.includes(k.teks))?.pesan ?? null;
};

const KASUS_SIMPAN: readonly Kasus[] = [
  {
    // tetapkanPerangkat: memindah perangkat atau laci yang punya sesi terbuka (K-04).
    status: 409,
    teks: "masih punya sesi kasir terbuka",
    pesan: "Kasir di mesin ini atau di laci itu masih buka. Tutup kasirnya dulu, lalu simpan lagi.",
  },
  {
    // Indeks unik tenantID dan akunKasID.
    status: 409,
    teks: "sudah dipakai perangkat lain",
    pesan: "Laci ini sudah dipakai mesin kasir lain. Pilih laci lain.",
  },
  {
    status: 404,
    teks: "Perangkat tidak ditemukan",
    pesan: "Perangkat ini tidak terdaftar lagi di toko. Pilih perangkat lain.",
  },
];

const KASUS_HAPUS: readonly Kasus[] = [
  {
    // hapusPerangkat selama sesi terbuka (K-05).
    status: 409,
    teks: "masih punya sesi kasir terbuka",
    pesan: "Kasir di mesin ini masih buka. Tutup kasirnya dulu, lalu lepas lagi.",
  },
];

const KASUS_TUTUP: readonly Kasus[] = [
  { status: 400, teks: "catatan wajib diisi", pesan: PESAN_CATATAN_WAJIB },
];

/** Gagal tambah atau ubah mesin kasir (POST /sesikasir/perangkat). */
export const pesanSimpanMesin = (err: unknown): string =>
  cocok(err, KASUS_SIMPAN) ?? pesanError(err, "Mesin kasir gagal disimpan.");

/** Gagal berhenti jadi mesin kasir (DELETE /sesikasir/perangkat/:id). */
export const pesanHapusMesin = (err: unknown): string =>
  cocok(err, KASUS_HAPUS) ?? pesanError(err, "Mesin kasir gagal dilepas.");

/** Gagal tutup kasir dari web (POST /sesikasir/:id/tutup). */
export const pesanTutupKasir = (err: unknown): string =>
  cocok(err, KASUS_TUTUP) ?? pesanError(err, "Kasir gagal ditutup.");
