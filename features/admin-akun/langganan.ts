import { formatTanggalPendek } from "@/lib/format";
import type {
  AkunAdmin,
  AksiLangganan,
  AktifkanPayload,
  BekukanPayload,
  DurasiLangganan,
  PerpanjangPayload,
  RiwayatLangganan,
} from "@/types/adminAkun";

/** Sama dengan DURASI_LANGGANAN_BULAN backend. */
export const PILIHAN_DURASI_BULAN: readonly DurasiLangganan[] = [1, 3, 6, 12];
export const BATAS_ALASAN = 200;

export interface AksiTersedia {
  bekukan: boolean;
  aktifkan: boolean;
  perpanjang: boolean;
}

/** Akun admin tidak berlangganan dan tidak dapat dibekukan (ditolak backend dengan 400). */
export function aksiLangganan(akun: AkunAdmin): AksiTersedia {
  const klien = akun.role === "client";
  return {
    bekukan: klien && akun.status === "aktif",
    aktifkan: klien && akun.status === "non-aktif",
    perpanjang: klien,
  };
}

/** Backend menolak aktifkan tanpa durasi bila masa akses kosong atau sudah lewat. */
export function durasiWajibSaatAktifkan(akun: AkunAdmin, sekarang: Date = new Date()): boolean {
  const berakhir = akun.langganan.aksesBerakhirPada;
  return !berakhir || new Date(berakhir) <= sekarang;
}

/** Perpanjangan hanya membuka akun yang beku karena kedaluwarsa, bukan yang dibekukan admin. */
export function akibatPerpanjang(akun: AkunAdmin): string {
  if (akun.status === "aktif") {
    return "Masa akses bertambah dari masa akses yang masih berjalan, atau dari hari ini bila sudah lewat.";
  }
  if (akun.langganan.alasanNonAktif === "kedaluwarsa") {
    return "Akun ini non-aktif karena kedaluwarsa dan akan aktif kembali setelah diperpanjang.";
  }
  return "Akun ini dibekukan admin. Perpanjangan menambah masa akses, tetapi akun tetap non-aktif sampai diaktifkan.";
}

export function payloadBekukan(alasan: string): BekukanPayload {
  const teks = alasan.trim();
  return teks ? { alasan: teks } : {};
}

export function payloadAktifkan(durasi: DurasiLangganan | null, alasan: string): AktifkanPayload {
  const payload: AktifkanPayload = payloadBekukan(alasan);
  if (durasi) payload.durasiBulan = durasi;
  return payload;
}

export function payloadPerpanjang(durasi: DurasiLangganan, alasan: string): PerpanjangPayload {
  return { durasiBulan: durasi, ...payloadBekukan(alasan) };
}

export const LABEL_AKSI: Record<AksiLangganan, string> = {
  buat: "Akun dibuat",
  perpanjang: "Diperpanjang",
  freeze: "Dibekukan",
  unfreeze: "Diaktifkan kembali",
  kedaluwarsa: "Kedaluwarsa",
};

/** Catatan tanpa olehAkunID ditulis job pembeku backend. */
export function pelakuRiwayat(catatan: RiwayatLangganan): string {
  return catatan.olehAkunID ? "Admin" : "Sistem";
}

/** Perubahan masa akses sebuah catatan; null bila masa aksesnya tidak berubah. */
export function teksPerubahanMasa(catatan: RiwayatLangganan): string | null {
  if (!catatan.berakhirSesudah || catatan.berakhirSebelum === catatan.berakhirSesudah) return null;
  const sesudah = formatTanggalPendek(catatan.berakhirSesudah);
  return catatan.berakhirSebelum
    ? `Masa akses ${formatTanggalPendek(catatan.berakhirSebelum)} menjadi ${sesudah}`
    : `Masa akses sampai ${sesudah}`;
}