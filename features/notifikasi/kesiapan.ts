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
 * Karyawan dan absensi (PW18, KS10a dan KS11a) dihitung dari ruang outlet.
 */
export type KunciLangkahKesiapan = "produk" | "posisi" | "karyawan" | "shift" | "pola" | "jadwal" | FiturPlan;

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
  /** Langkah karyawan opsional: kartu dan kotaknya membawa tombol "Toko ini hanya saya" (KS10a). */
  bolehHanyaOwner?: boolean;
}

export interface DataKesiapan {
  /** Hitungan produk ringkasan dashboard outlet; null bila belum termuat atau tidak dimuat. */
  produk: HitunganProduk | null | undefined;
  /** Fitur plan yang dapat di-setup pengguna ini (fiturSetupPengguna). */
  fitur: readonly { fitur: FiturPlan; selesai: boolean }[];
  /**
   * Bidang karyawan dan absensi outlet (PW18); null berarti belum termuat
   * atau tidak berizin membacanya, sehingga langkahnya tidak dihitung.
   */
  karyawan?: {
    /** Ada posisi (role) di bawah level Owner yang dapat diberikan ke staf. */
    posisi: boolean | null;
    /** Ada staf selain Owner (pengguna lebih dari satu, KS8a). */
    staf: boolean | null;
    /** Owner menyatakan toko dijalankan sendiri di perangkat ini (KS10a). */
    hanyaOwner: boolean;
  };
  absensi?: {
    shiftAktif: boolean | null;
    pola: boolean | null;
    /** Ada jadwal outlet dalam 62 hari sampai akhir minggu depan (KS11a). */
    jadwal: boolean | null;
  };
}

export const URL_POSISI = "/dashboard/outlet/pengaturan/roles";
export const URL_PENGGUNA_OUTLET = "/dashboard/outlet/pengguna";
export const URL_SHIFT_OUTLET = "/dashboard/outlet/shift";
export const URL_POLA_OUTLET = "/dashboard/outlet/pola-roster";
export const URL_GENERATE_OUTLET = "/dashboard/outlet/jadwal/generate";

const SOLO = " Lewati bila toko dijalankan Owner sendiri.";

/**
 * Langkah karyawan (opsional, Info) lalu absensi (Perlu tindakan, hanya bila
 * ada staf), KS10a dan KS11a. Toko yang menyatakan hanya Owner melewati
 * keduanya selama belum ada staf; begitu ada staf, langkah absensi muncul.
 */
function langkahKaryawanAbsensi(data: DataKesiapan): LangkahKesiapan[] {
  const k = data.karyawan;
  if (!k || k.staf === null) return [];
  const daftar: LangkahKesiapan[] = [];
  if (!k.staf && k.hanyaOwner) return daftar;
  if (k.posisi !== null) {
    daftar.push({
      kunci: "posisi",
      judul: "Buat posisi karyawan",
      penjelasan: "Karyawan memerlukan posisi selain Owner: buat posisi beserta hak aksesnya." + SOLO,
      tingkat: "info",
      href: URL_POSISI,
      labelTautan: "Buat posisi",
      selesai: k.posisi || k.staf,
      bolehHanyaOwner: true,
    });
  }
  daftar.push({
    kunci: "karyawan",
    judul: "Tambah karyawan",
    penjelasan: "Setiap karyawan masuk dengan nama dan PIN sendiri, dengan posisi yang sudah dibuat." + SOLO,
    tingkat: "info",
    href: URL_PENGGUNA_OUTLET,
    labelTautan: "Tambah karyawan",
    selesai: k.staf,
    bolehHanyaOwner: true,
  });
  const a = data.absensi;
  if (!k.staf || !a) return daftar;
  const absensi: [KunciLangkahKesiapan, boolean | null, string, string, string, string][] = [
    ["shift", a.shiftAktif, "Buat Master Shift", "Absensi karyawan memakai shift: jam masuk, jam pulang, dan toleransi terlambat.", URL_SHIFT_OUTLET, "Buat shift"],
    ["pola", a.pola, "Buat Pola Roster", "Pola roster adalah siklus hari kerja dan libur yang menjadi template jadwal.", URL_POLA_OUTLET, "Buat pola roster"],
    ["jadwal", a.jadwal, "Generate jadwal", "Buat jadwal karyawan dari pola roster agar absensi tercatat sesuai shift.", URL_GENERATE_OUTLET, "Generate jadwal"],
  ];
  for (const [kunci, selesai, judul, penjelasan, href, labelTautan] of absensi) {
    if (selesai === null) continue;
    daftar.push({ kunci, judul, penjelasan, tingkat: "tindakan", href, labelTautan, selesai });
  }
  return daftar;
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
  daftar.push(...langkahKaryawanAbsensi(data));
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
    ...(langkah.bolehHanyaOwner ? { tombol: { aksi: "hanya-owner" as const, label: "Toko ini hanya saya" } } : {}),
  };
}

/** Rentang tarikan jadwal backend paling panjang (jadwalShiftService.getAll). */
export const RENTANG_JADWAL_HARI = 62;

/**
 * Rentang langkah jadwal (KS11a): 62 hari yang berakhir di akhir minggu
 * depan, sehingga toko yang pernah membuat jadwal tidak kembali ke mode
 * setup, dan jadwal minggu depan ikut terhitung.
 */
export function rentangJadwalKesiapan(akhirMingguDepan: string): { startDate: string; endDate: string } {
  const [y, m, d] = akhirMingguDepan.split("-").map(Number);
  const awal = new Date(y, m - 1, d - (RENTANG_JADWAL_HARI - 1));
  const dua = (n: number) => String(n).padStart(2, "0");
  return {
    startDate: `${awal.getFullYear()}-${dua(awal.getMonth() + 1)}-${dua(awal.getDate())}`,
    endDate: akhirMingguDepan,
  };
}
