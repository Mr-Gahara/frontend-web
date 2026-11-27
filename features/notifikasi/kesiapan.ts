import { NAMA_FITUR, type FiturPlan } from "@/lib/auth/fitur-plan";
import { bolehTautan, type AksesTautan } from "./akses";
import type { Pemberitahuan, TingkatPemberitahuan } from "./jenis";
import { URL_BUAT_PRODUK, type HitunganProduk } from "./sumber-stok-produk";

/**
 * Kesiapan toko (PW19, modul/pemberitahuan.md KS1a sampai KS9a): selama
 * toko belum siap beroperasi, lonceng mendahulukan satu kartu "Siapkan
 * toko" berisi langkah pertama yang belum selesai. Dihitung terus dari data
 * seperti LN5a, tanpa penyimpanan, sehingga toko lama yang datanya lengkap
 * langsung siap.
 *
 * Urutan bidang (KS1a): produk, karyawan, absensi, lalu fitur plan.
 * Karyawan dan absensi diisi PW18 di antara produk dan fitur plan.
 */
export type KunciLangkahKesiapan = "produk" | FiturPlan;

export interface LangkahKesiapan {
  kunci: KunciLangkahKesiapan;
  /** Nama langkah, disebut di kartu dan sebagai langkah sesudahnya. */
  judul: string;
  penjelasan: string;
  /** Tingkat kartu yang digantikan langkah ini (KS7a, LN11a). */
  tingkat: TingkatPemberitahuan;
  href: string;
  labelTautan: string;
  selesai: boolean;
}

export interface DataKesiapan {
  /** Hitungan produk ringkasan dashboard outlet; null bila belum termuat atau tidak dimuat. */
  produk: HitunganProduk | null | undefined;
  /** Fitur plan yang dapat di-setup pengguna ini (fiturSetupPengguna). */
  fitur: readonly { fitur: FiturPlan; selesai: boolean }[];
}

export const URL_SETUP = "/setup";

const langkahFitur = (fitur: FiturPlan, selesai: boolean): LangkahKesiapan => ({
  kunci: fitur,
  judul: `Setup ${NAMA_FITUR[fitur]}`,
  penjelasan: `Setup ${NAMA_FITUR[fitur]} belum selesai, sehingga fiturnya masih terkunci.`,
  tingkat: "info",
  href: URL_SETUP,
  labelTautan: "Lengkapi setup",
  selesai,
});

/**
 * Langkah kesiapan berurutan yang berlaku bagi pengguna ini. Langkah produk
 * hanya "toko punya produk" (KS5a): kehabisan stok tetap kartu operasional
 * LN22a, agar toko yang sudah berjalan tidak kembali ke mode setup. Langkah
 * yang datanya belum diketahui tidak dihitung.
 */
export function langkahKesiapan(data: DataKesiapan): LangkahKesiapan[] {
  const daftar: LangkahKesiapan[] = [];
  if (data.produk) {
    daftar.push({
      kunci: "produk",
      judul: "Buat produk",
      penjelasan: "Toko belum punya produk. Buat produk lebih dulu agar kasir dapat mencatat penjualan.",
      tingkat: "penting",
      href: URL_BUAT_PRODUK,
      labelTautan: "Buat Produk",
      selesai: data.produk.total > 0,
    });
  }
  // Karyawan dan absensi (PW18) disisipkan di sini.
  for (const f of data.fitur) daftar.push(langkahFitur(f.fitur, f.selesai));
  return daftar;
}

export interface KeadaanKesiapan {
  langkah: LangkahKesiapan;
  /** Nomor langkah ini di antara seluruh langkah yang berlaku, mulai 1. */
  nomor: number;
  total: number;
  /** Langkah belum selesai sesudahnya, untuk kalimat "Sesudahnya". */
  berikutnya: LangkahKesiapan | null;
}

/** Langkah pertama yang belum selesai; null bila toko sudah siap. */
export function keadaanKesiapan(daftar: readonly LangkahKesiapan[]): KeadaanKesiapan | null {
  const i = daftar.findIndex((l) => !l.selesai);
  if (i === -1) return null;
  const berikutnya = daftar.slice(i + 1).find((l) => !l.selesai) ?? null;
  return { langkah: daftar[i], nomor: i + 1, total: daftar.length, berikutnya };
}

/**
 * Satu kartu "Siapkan toko" (KS3a): langkah yang dapat dikerjakan sekarang
 * beserta tautannya bila pengguna berizin, paling atas di panel (KS2a).
 * Menggantikan kartu Toko belum punya produk dan kartu Setup fitur (KS6a).
 */
export function pemberitahuanKesiapan(keadaan: KeadaanKesiapan | null, akses: AksesTautan): Pemberitahuan | null {
  if (!keadaan) return null;
  const { langkah, nomor, total, berikutnya } = keadaan;
  const sesudah = berikutnya ? ` Sesudahnya: ${berikutnya.judul}.` : "";
  return {
    id: "kesiapan-toko",
    tingkat: langkah.tingkat,
    utama: true,
    judul: `Siapkan toko (langkah ${nomor} dari ${total})`,
    isi: `${langkah.judul}. ${langkah.penjelasan}${sesudah}`,
    // /setup tidak bergerbang IZIN_HALAMAN; fiturSetupPengguna sudah memeriksa izin buat datanya.
    tautan:
      langkah.href === URL_SETUP || bolehTautan(akses, langkah.href)
        ? [{ href: langkah.href, label: langkah.labelTautan }]
        : [],
  };
}
