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
 * Karyawan dan absensi (PW18, KS10a dan KS11a) dihitung dari ruang outlet,
 * lalu bidang gudang di akhir (PW20, KS14a sampai KS16a).
 */
export type KunciLangkahKesiapan =
  | "produk"
  | "posisi"
  | "karyawan"
  | "shift"
  | "pola"
  | "jadwal"
  | FiturPlan
  | "barang-gudang"
  | "shift-gudang"
  | "pola-gudang"
  | "jadwal-gudang";

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
    /** Ada staf selain Owner di ruang mana pun (pengguna toko lebih dari satu). */
    staf: boolean | null;
    /** Owner menyatakan toko dijalankan sendiri di perangkat ini (KS10a). */
    hanyaOwner: boolean;
  };
  /** Absensi ruang outlet (KS11a), dihitung bila ada staf ruang outlet (KS15a). */
  absensi?: DataAbsensiRuang;
  /**
   * Bidang gudang (PW20, KS14a sampai KS16a), hanya bila toko punya lokasi
   * gudang: barang gudang pertama, lalu absensi gudang bila ada staf gudang.
   */
  gudang?: { barang: boolean | null; absensi: DataAbsensiRuang };
}

export interface DataAbsensiRuang {
  /** Ada staf ruang ini selain Owner (GET /pengguna?workspace=, KS15a). */
  staf: boolean | null;
  shiftAktif: boolean | null;
  pola: boolean | null;
  /** Ada jadwal ruang dalam 62 hari sampai akhir minggu depan (KS11a). */
  jadwal: boolean | null;
}

export const URL_POSISI = "/dashboard/outlet/pengaturan/roles";
export const URL_PENGGUNA_OUTLET = "/dashboard/outlet/pengguna";
export const URL_SHIFT_OUTLET = "/dashboard/outlet/shift";
export const URL_POLA_OUTLET = "/dashboard/outlet/pola-roster";
export const URL_GENERATE_OUTLET = "/dashboard/outlet/jadwal/generate";
export const URL_INVENTARIS_GUDANG = "/dashboard/gudang/inventaris";

const SOLO = " Lewati bila toko dijalankan Owner sendiri.";

/** Karyawan tidak perlu disiapkan: Owner menyatakan toko dijalankan sendiri dan belum ada staf (KS10a). */
const lewatiKaryawan = (data: DataKesiapan) => !!data.karyawan && data.karyawan.staf === false && data.karyawan.hanyaOwner;

/**
 * Langkah karyawan (opsional, Info), KS10a: Buat posisi lalu Tambah
 * karyawan, dihitung se-toko (staf di ruang mana pun).
 */
function langkahKaryawan(data: DataKesiapan): LangkahKesiapan[] {
  const k = data.karyawan;
  if (!k || k.staf === null || lewatiKaryawan(data)) return [];
  const daftar: LangkahKesiapan[] = [];
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
  return daftar;
}

/**
 * Langkah absensi satu ruang (Perlu tindakan), KS11a dan KS15a: hanya bila
 * ruang itu punya staf selain Owner. Langkah yang datanya belum diketahui
 * tidak dihitung.
 */
function langkahAbsensi(ruang: "outlet" | "gudang", a: DataAbsensiRuang | undefined): LangkahKesiapan[] {
  if (!a || a.staf !== true) return [];
  const g = ruang === "gudang";
  const di = g ? " gudang" : "";
  const akhiran = (k: "shift" | "pola" | "jadwal") => (g ? (`${k}-gudang` as const) : k);
  const absensi: [KunciLangkahKesiapan, boolean | null, string, string, string, string][] = [
    [akhiran("shift"), a.shiftAktif, `Buat Master Shift${di}`, `Absensi karyawan${di} memakai shift: jam masuk, jam pulang, dan toleransi terlambat.`, `/dashboard/${ruang}/shift`, "Buat shift"],
    [akhiran("pola"), a.pola, `Buat Pola Roster${di}`, "Pola roster adalah siklus hari kerja dan libur yang menjadi template jadwal.", `/dashboard/${ruang}/pola-roster`, "Buat pola roster"],
    [akhiran("jadwal"), a.jadwal, `Generate jadwal${di}`, `Buat jadwal karyawan${di} dari pola roster agar absensi tercatat sesuai shift.`, `/dashboard/${ruang}/jadwal/generate`, "Generate jadwal"],
  ];
  const daftar: LangkahKesiapan[] = [];
  for (const [kunci, selesai, judul, penjelasan, href, labelTautan] of absensi) {
    if (selesai === null) continue;
    daftar.push({ kunci, judul, penjelasan, tingkat: "tindakan", href, labelTautan, selesai });
  }
  return daftar;
}

/**
 * Bidang gudang (PW20): barang gudang pertama (KS16a; sekali punya tetap
 * siap, seperti KS5a), lalu absensi gudang bila ada staf gudang.
 */
function langkahGudang(data: DataKesiapan): LangkahKesiapan[] {
  const g = data.gudang;
  if (!g) return [];
  const daftar: LangkahKesiapan[] = [];
  if (g.barang !== null) {
    daftar.push({
      kunci: "barang-gudang",
      judul: "Masukkan barang gudang",
      penjelasan: "Gudang baru mulai kosong: masukkan barang dari master data toko agar stok gudang dapat dikelola.",
      tingkat: "tindakan",
      href: URL_INVENTARIS_GUDANG,
      labelTautan: "Masukkan barang",
      selesai: g.barang,
    });
  }
  if (!lewatiKaryawan(data)) daftar.push(...langkahAbsensi("gudang", g.absensi));
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
  daftar.push(...langkahKaryawan(data));
  if (!lewatiKaryawan(data)) daftar.push(...langkahAbsensi("outlet", data.absensi));
  for (const f of data.fitur) daftar.push(langkahFitur(f.fitur, f.selesai));
  // Bidang gudang di akhir, sesudah fitur plan (KS14a).
  daftar.push(...langkahGudang(data));
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
