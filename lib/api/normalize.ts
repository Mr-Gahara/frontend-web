/**
 * Normalisasi respons backend.
 *
 * Dua masalah yang ditangani, keduanya terdokumentasi di
 * docs/kontrak-api.md bagian 2.4 dan 2.5:
 *
 * 1. Envelope tidak seragam. Enam variasi ditemukan pada sampel respons:
 *    { data }, { data, success }, { count, data, success },
 *    { data, message, success }, { data, message, total }, { data, message }.
 *    Seluruhnya memuat data.
 *
 * 2. Identitas tidak seragam. Sebagian modul memakai id, sebagian _id,
 *    sebagian mencampur (id di tingkat atas, _id di objek bertingkat),
 *    dan beberapa masih membawa __v.
 */

import { ApiError } from "./error";

type Rekaman = Record<string, unknown>;

const objekBiasa = (v: unknown): v is Rekaman =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);

/**
 * Mengubah _id menjadi id secara rekursif dan membuang __v.
 * Bila sebuah objek memiliki id dan _id sekaligus, id dipertahankan.
 */
export function normalizeId<T>(input: T): T {
  if (Array.isArray(input)) return input.map(normalizeId) as unknown as T;
  if (!objekBiasa(input)) return input;

  const hasil: Rekaman = {};
  for (const [kunci, nilai] of Object.entries(input)) {
    if (kunci === "__v") continue;
    if (kunci === "_id") {
      if (!("id" in input)) hasil.id = nilai;
      continue;
    }
    hasil[kunci] = normalizeId(nilai);
  }
  return hasil as T;
}

export interface HasilApi<T> {
  data: T;
  /** Dari count atau total bila dikirim backend. */
  jumlah?: number;
  message?: string;
}

/**
 * Mengambil isi dari envelope dan menormalkan identitasnya.
 *
 * Melempar ApiError bila backend menjawab 200 dengan success: false,
 * yang dipakai login PIN aplikasi untuk perangkat menunggu persetujuan
 * (docs/kontrak-api.md bagian 2.3).
 */
export function unwrap<T>(respons: unknown): HasilApi<T> {
  if (!objekBiasa(respons)) {
    return { data: normalizeId(respons) as T };
  }

  if (respons.success === false) {
    throw new ApiError(
      200,
      typeof respons.message === "string" ? respons.message : "Permintaan ditolak.",
      [],
      typeof respons.code === "string" ? respons.code : undefined,
    );
  }

  const isi = "data" in respons ? respons.data : respons;
  const jumlah =
    typeof respons.count === "number"
      ? respons.count
      : typeof respons.total === "number"
        ? respons.total
        : undefined;

  return {
    data: normalizeId(isi) as T,
    jumlah,
    message: typeof respons.message === "string" ? respons.message : undefined,
  };
}

/** Bentuk ringkas bila hanya isinya yang dibutuhkan. */
export const ambilData = <T>(respons: unknown): T => unwrap<T>(respons).data;