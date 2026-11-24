import { z } from "zod";
import type { PenggunaDetail, PerbaruiProfilPayload } from "@/types/pengguna";

/**
 * Skema, nilai awal, dan payload kedua form profil sendiri. Mengikuti
 * validators/penggunaValidator.js backend mode update: nama 3 sampai 50
 * karakter, pinBaru tepat 6 digit angka (keputusan Fase 0), dan PIN hanya
 * berubah lewat pasangan pinLama dan pinBaru. Format akhir nomor HP
 * diputuskan backend (isMobilePhone id-ID) dan pesannya ditampilkan apa
 * adanya (keputusan PF8a); form hanya menolak karakter selain angka dan
 * tanda + di depan.
 */
const POLA_PIN = /^\d{6}$/;
const POLA_NOMOR_HP = /^\+?\d+$/;

/** Tab Data Diri (keputusan PU1a): nama dan nomor HP, disimpan terpisah dari PIN. */
export const skemaDataDiri = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .min(3, "Nama minimal 3 karakter")
    .max(50, "Nama maksimal 50 karakter"),
  nomorHp: z
    .string()
    .trim()
    .refine(
      (v): boolean => v === "" || POLA_NOMOR_HP.test(v),
      "Nomor HP hanya boleh berisi angka",
    ),
});

export type NilaiDataDiri = z.infer<typeof skemaDataDiri>;

/**
 * Tab Keamanan PIN (keputusan PU1a): form sendiri, sehingga kedua isian
 * wajib. PIN baru tepat 6 digit angka (keputusan Fase 0), dan PIN lama
 * mengonfirmasi perubahan.
 */
export const skemaPin = z
  .object({ pinLama: z.string(), pinBaru: z.string() })
  .superRefine((nilai, ctx) => {
    if (nilai.pinLama === "") {
      ctx.addIssue({
        code: "custom",
        path: ["pinLama"],
        message: "Masukkan PIN lama untuk mengonfirmasi perubahan",
      });
    }
    if (nilai.pinBaru === "") {
      ctx.addIssue({ code: "custom", path: ["pinBaru"], message: "PIN baru wajib diisi" });
    } else if (!POLA_PIN.test(nilai.pinBaru)) {
      ctx.addIssue({ code: "custom", path: ["pinBaru"], message: "PIN baru harus tepat 6 digit angka" });
    }
  });

export type NilaiPin = z.infer<typeof skemaPin>;

export const NILAI_AWAL_PIN: NilaiPin = { pinLama: "", pinBaru: "" };

/** Nilai awal Data Diri dari data tersimpan; nomor HP null menjadi teks kosong. */
export function nilaiAwalDataDiri(pengguna: PenggunaDetail): NilaiDataDiri {
  return { nama: pengguna.nama, nomorHp: pengguna.nomorHp ?? "" };
}

/**
 * Payload PUT /pengguna/:id untuk Data Diri: hanya field yang berbeda dari
 * data server (keputusan rancangan butir 15). Nomor HP yang dikosongkan
 * dikirim sebagai null, karena validator backend melewati null tetapi
 * memeriksa teks kosong sebagai nomor. Hasil kosong berarti tidak ada
 * perubahan, dan pemanggil tidak mengirimnya.
 */
export function payloadDataDiri(nilai: NilaiDataDiri, pengguna: PenggunaDetail): PerbaruiProfilPayload {
  const payload: PerbaruiProfilPayload = {};
  if (nilai.nama !== pengguna.nama) payload.nama = nilai.nama;
  if (nilai.nomorHp !== (pengguna.nomorHp ?? "")) {
    payload.nomorHp = nilai.nomorHp === "" ? null : nilai.nomorHp;
  }
  return payload;
}

/** Payload ganti PIN: pasangan pinLama dan pinBaru saja. */
export function payloadGantiPin(nilai: NilaiPin): PerbaruiProfilPayload {
  return { pinLama: nilai.pinLama, pinBaru: nilai.pinBaru };
}

/** Membuang setiap karakter selain angka (isian PIN). */
export function hanyaAngka(teks: string): string {
  return teks.replace(/\D/g, "");
}

/** Menyisakan angka, dan satu tanda + bila ada di depan (isian nomor HP). */
export function saringNomorHp(teks: string): string {
  const bersih = teks.replace(/[^\d+]/g, "");
  const angka = bersih.replace(/\+/g, "");
  return bersih.startsWith("+") ? "+" + angka : angka;
}

/** Dua huruf awal nama untuk avatar (keputusan PF9a); "US" bila nama kosong. */
export function inisialNama(nama: string): string {
  return nama.trim().substring(0, 2).toUpperCase() || "US";
}

/**
 * Kunci pemasangan form. Respons pengguna tidak membawa updatedAt, sehingga
 * form dipasang ulang saat nilai tersimpan yang ditampilkannya berubah.
 */
export function kunciFormProfil(pengguna: PenggunaDetail): string {
  return [pengguna.id, pengguna.nama, pengguna.nomorHp ?? ""].join("|");
}