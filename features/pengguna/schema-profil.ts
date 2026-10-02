import { z } from "zod";
import type { PenggunaDetail, PerbaruiProfilPayload } from "@/types/pengguna";

/**
 * Skema, nilai awal, dan payload form profil sendiri. Mengikuti
 * validators/penggunaValidator.js backend mode update: nama 3 sampai 50
 * karakter, pinBaru tepat 6 digit angka (keputusan Fase 0), dan PIN hanya
 * berubah lewat pasangan pinLama dan pinBaru. Format akhir nomor HP
 * diputuskan backend (isMobilePhone id-ID) dan pesannya ditampilkan apa
 * adanya (keputusan PF8a); form hanya menolak karakter selain angka dan
 * tanda + di depan.
 */
const POLA_PIN = /^\d{6}$/;
const POLA_NOMOR_HP = /^\+?\d+$/;

export const skemaProfil = z
  .object({
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
    pinLama: z.string(),
    pinBaru: z.string(),
  })
  .superRefine((nilai, ctx) => {
    if (nilai.pinLama === "" && nilai.pinBaru === "") return;
    if (nilai.pinBaru === "") {
      ctx.addIssue({
        code: "custom",
        path: ["pinBaru"],
        message: "Isi PIN baru, atau kosongkan PIN lama bila tidak mengubah PIN",
      });
      return;
    }
    if (!POLA_PIN.test(nilai.pinBaru)) {
      ctx.addIssue({
        code: "custom",
        path: ["pinBaru"],
        message: "PIN baru harus tepat 6 digit angka",
      });
    }
    if (nilai.pinLama === "") {
      ctx.addIssue({
        code: "custom",
        path: ["pinLama"],
        message: "Masukkan PIN lama untuk mengonfirmasi perubahan",
      });
    }
  });

export type NilaiFormProfil = z.infer<typeof skemaProfil>;

/** Nilai awal form dari data tersimpan; nomor HP null menjadi teks kosong. */
export function nilaiAwalProfil(pengguna: PenggunaDetail): NilaiFormProfil {
  return {
    nama: pengguna.nama,
    nomorHp: pengguna.nomorHp ?? "",
    pinLama: "",
    pinBaru: "",
  };
}

/**
 * Payload PUT /pengguna/:id untuk profil sendiri: hanya field yang berbeda
 * dari data server (keputusan rancangan butir 15). Nomor HP yang
 * dikosongkan dikirim sebagai null, karena validator backend melewati null
 * tetapi memeriksa teks kosong sebagai nomor. PIN dikirim sebagai pasangan
 * pinLama dan pinBaru hanya bila PIN baru diisi. Hasil kosong berarti tidak
 * ada perubahan, dan pemanggil tidak mengirimnya.
 */
export function payloadPerbaruiProfil(
  nilai: NilaiFormProfil,
  pengguna: PenggunaDetail,
): PerbaruiProfilPayload {
  const payload: PerbaruiProfilPayload = {};
  if (nilai.nama !== pengguna.nama) payload.nama = nilai.nama;
  if (nilai.nomorHp !== (pengguna.nomorHp ?? "")) {
    payload.nomorHp = nilai.nomorHp === "" ? null : nilai.nomorHp;
  }
  if (nilai.pinBaru !== "") {
    payload.pinLama = nilai.pinLama;
    payload.pinBaru = nilai.pinBaru;
  }
  return payload;
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