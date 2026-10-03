import * as z from "zod";
import type { AkunKas } from "@/types/akunKas";
import type { PayloadUbahAkunKas } from "./api";

export const URL_DAFTAR_AKUN_KAS = "/dashboard/outlet/keuangan/akunkas";
export const urlUbahAkunKas = (id: string) => `${URL_DAFTAR_AKUN_KAS}/${id}/ubah`;

/**
 * Skema form ubah akun kas (keputusan UA3a dan UA4a). Saldo dan status tidak
 * ada di form: saldo ditolak validator backend saat update, dan status
 * diganti lewat aksi tersendiri (nonaktifkan, aktifkan kembali). Batas
 * panjang sama dengan BATAS_PANJANG validator backend, dihitung setelah
 * dipangkas.
 */
export const skemaUbahAkunKas = z.object({
  tipeAkun: z.enum(["Kas Fisik", "Rekening Bank"], {
    message: "Tipe akun wajib dipilih.",
  }),
  namaAkun: z
    .string()
    .trim()
    .min(1, "Nama Akun wajib diisi.")
    .max(100, "Nama Akun maksimal 100 karakter."),
  nomorAkun: z
    .string()
    .trim()
    .min(1, "Nomor Akun wajib diisi.")
    .max(50, "Nomor Akun maksimal 50 karakter."),
  keterangan: z.string().trim().max(255, "Keterangan maksimal 255 karakter."),
});

export type IsianUbahAkunKas = z.infer<typeof skemaUbahAkunKas>;

/** Nilai awal form dari akun yang dimuat; keterangan null menjadi isian kosong. */
export function isianAwalUbah(akun: AkunKas): IsianUbahAkunKas {
  return {
    tipeAkun: akun.tipeAkun,
    namaAkun: akun.namaAkun,
    nomorAkun: akun.nomorAkun,
    keterangan: akun.keterangan ?? "",
  };
}

/**
 * Payload PUT berisi hanya field yang berubah terhadap akun yang dimuat
 * (keputusan UA4a). Teks dibandingkan setelah dipangkas, sehingga spasi di
 * tepi tidak dihitung perubahan. Keterangan yang dikosongkan dikirim null.
 * Payload kosong berarti tidak ada perubahan dan tidak dikirim: backend
 * menolaknya dengan 400.
 */
export function payloadUbahAkunKas(akun: AkunKas, isian: IsianUbahAkunKas): PayloadUbahAkunKas {
  const payload: PayloadUbahAkunKas = {};
  const namaAkun = isian.namaAkun.trim();
  const nomorAkun = isian.nomorAkun.trim();
  const keterangan = isian.keterangan.trim();
  if (isian.tipeAkun !== akun.tipeAkun) payload.tipeAkun = isian.tipeAkun;
  if (namaAkun !== akun.namaAkun.trim()) payload.namaAkun = namaAkun;
  if (nomorAkun !== akun.nomorAkun.trim()) payload.nomorAkun = nomorAkun;
  if (keterangan !== (akun.keterangan ?? "").trim()) {
    payload.keterangan = keterangan === "" ? null : keterangan;
  }
  return payload;
}

export function adaPerubahanAkunKas(akun: AkunKas, isian: IsianUbahAkunKas): boolean {
  return Object.keys(payloadUbahAkunKas(akun, isian)).length > 0;
}