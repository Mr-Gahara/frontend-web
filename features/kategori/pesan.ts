/**
 * Penerjemahan pesan kegagalan simpan kategori.
 *
 * Sejak backend P72 (B304) nama atau kode kembar dijawab 409
 * "<field> sudah dipakai kategori lain di toko ini.", dengan field
 * namaKategori atau kodeKategori. Backend hanya menyebut index pertama yang
 * bentrok, sehingga bila nama dan kode sama-sama kembar hanya satu yang
 * disebut. Karena itu field yang bentrok tetap ditentukan dari daftar
 * kategori yang sudah dimuat, dan field dari pesan backend dipakai bila
 * daftar tidak menunjukkan bentrok (misalnya kategori dibuat pengguna lain
 * setelah daftar dimuat).
 */

import { pesanError } from "@/lib/api/error";
import type { Kategori, KategoriRequest } from "@/types/kategori";

export interface KonteksDuplikatKategori {
  nilai: KategoriRequest;
  daftar: Kategori[];
  /** Id kategori yang sedang diedit, agar tidak dianggap bentrok dengan dirinya sendiri. */
  idDiedit?: string;
}

const POLA_KEMBAR = /\b(namaKategori|kodeKategori) sudah dipakai kategori lain/;

export function pesanErrorKategori(
  err: unknown,
  fallback: string,
  konteks: KonteksDuplikatKategori,
): string {
  const pesan = pesanError(err, fallback);
  const cocok = POLA_KEMBAR.exec(pesan);
  if (!cocok) return pesan;

  const lain = konteks.daftar.filter((k) => k.id !== konteks.idDiedit);
  const bentrokNama = lain.some(
    (k) => k.namaKategori === konteks.nilai.namaKategori,
  );
  const bentrokKode = lain.some(
    (k) => k.kodeKategori === konteks.nilai.kodeKategori,
  );

  if (bentrokNama && bentrokKode) {
    return "Nama kategori dan kode kategori sudah dipakai.";
  }
  if (bentrokNama) return "Nama kategori sudah dipakai.";
  if (bentrokKode) return "Kode kategori sudah dipakai.";
  return cocok[1] === "kodeKategori"
    ? "Kode kategori sudah dipakai."
    : "Nama kategori sudah dipakai.";
}
