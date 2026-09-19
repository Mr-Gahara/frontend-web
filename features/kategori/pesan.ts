/**
 * Penerjemahan pesan kegagalan simpan kategori.
 *
 * Duplikat nama atau kode dijawab backend dengan 400 berisi errors
 * "<field> sudah digunakan di tenant ini" tanpa message. Nama field itu tidak
 * dapat diandalkan: kategoriService mengambil kunci pertama err.keyValue,
 * sedangkan indeks unik kategori berupa gabungan { tenantID, namaKategori }
 * dan { tenantID, kodeKategori }, sehingga yang terbaca selalu tenantID.
 *
 * Karena itu field yang bentrok ditentukan dari daftar kategori yang sudah
 * dimuat. Penanganan ini tetap benar setelah backend menyebut field yang
 * benar, dan dapat disederhanakan saat itu.
 */

import { pesanError } from "@/lib/api/error";
import type { Kategori, KategoriRequest } from "@/types/kategori";

export interface KonteksDuplikatKategori {
  nilai: KategoriRequest;
  daftar: Kategori[];
  /** Id kategori yang sedang diedit, agar tidak dianggap bentrok dengan dirinya sendiri. */
  idDiedit?: string;
}

export function pesanErrorKategori(
  err: unknown,
  fallback: string,
  konteks: KonteksDuplikatKategori,
): string {
  const pesan = pesanError(err, fallback);
  if (!pesan.includes("sudah digunakan di tenant ini")) return pesan;

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
  return "Nama atau kode kategori sudah dipakai.";
}