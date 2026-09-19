/**
 * Tipe bersama untuk data dari backend.
 *
 * Sumber: docs/kontrak-api.md bagian 2.5. Respons backend memakai id atau
 * _id tergantung modul, tetapi lapisan lib/api/normalize.ts sudah
 * menormalkannya menjadi id sebelum sampai ke komponen. Karena itu tipe
 * di sini selalu memakai id dan tidak pernah _id.
 */

/** Entitas dari backend, setelah normalisasi identitas. */
export interface Entitas {
  id: string;
}

/** Sebagian besar koleksi memakai timestamps otomatis Mongoose. */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** Referensi hasil populate: hanya sebagian field yang dikirim backend. */
export interface Ref extends Entitas {
  nama: string;
}

/** Referensi lokasi pada modul inventaris dan WMS. */
export interface RefLokasi extends Entitas {
  nama: string;
  tipe: "Gudang" | "Outlet";
}

/** Hasil pemanggilan daftar beserta jumlah bila backend mengirimnya. */
export interface HasilDaftar<T> {
  data: T[];
  jumlah?: number;
}
