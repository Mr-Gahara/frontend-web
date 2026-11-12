import { keTanggalLokal } from "@/lib/waktu";
import type { AngkaArusKas, BarisArusKas } from "@/types/laporan";

/**
 * Halaman arus kas (B291, desain D pemilik proyek 12 November 2026): filter,
 * parameter GET /laporan/arus-kas, dan susunan tampilan sebagai fungsi murni.
 */

export type KelompokArusKas = "hari" | "minggu" | "bulan";
export type FormatUnduhan = "pdf" | "xlsx" | "csv";

export interface FilterArusKas {
  /** Kosong berarti seluruh akun kas; transfer antar akun tidak dihitung. */
  akunKasID: string;
  dari: Date;
  sampai: Date;
  kelompok: KelompokArusKas;
}

export const LABEL_KELOMPOK: Record<KelompokArusKas, string> = { hari: "Hari", minggu: "Minggu", bulan: "Bulan" };
export const JUDUL_KELOMPOK: Record<KelompokArusKas, string> = {
  hari: "Per hari",
  minggu: "Per minggu",
  bulan: "Per bulan",
};
export const PILIHAN_UNDUHAN: { format: FormatUnduhan; label: string }[] = [
  { format: "pdf", label: "PDF" },
  { format: "xlsx", label: "Excel" },
  { format: "csv", label: "CSV" },
];

/** Saat halaman dibuka: tanggal 1 bulan berjalan sampai hari ini, seluruh akun, per hari (pemilik proyek). */
export function filterAwalArusKas(sekarang: Date = new Date()): FilterArusKas {
  return {
    akunKasID: "",
    dari: new Date(sekarang.getFullYear(), sekarang.getMonth(), 1),
    sampai: new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()),
    kelompok: "hari",
  };
}

/**
 * Query backend. Tanggal dikirim sebagai hari lokal YYYY-MM-DD (hari WIB,
 * keduanya ikut dihitung). periode tidak dikirim: bawaan backend bukan
 * harian, sehingga rentang satu hari tetap dikelompokkan per hari, bukan per jam.
 */
export function parameterArusKas(filter: FilterArusKas, format?: FormatUnduhan): Record<string, string> {
  return {
    startDate: keTanggalLokal(filter.dari),
    endDate: keTanggalLokal(filter.sampai),
    kelompok: filter.kelompok,
    ...(filter.akunKasID ? { akunKasID: filter.akunKasID } : {}),
    ...(format ? { format } : {}),
  };
}

export interface BarisRincian {
  label: string;
  nilai: number;
  /** Pembatalan atau pembalik dari jenis lawannya, ditandai lencana "Pembatalan". */
  pembatalan: boolean;
  /** Lebar batang terhadap nilai terbesar di kedua panel, 0 sampai 100. */
  persen: number;
}

export interface PanelRincian {
  judul: "Uang masuk" | "Uang keluar";
  total: number;
  baris: BarisRincian[];
}

type Sumber = [label: string, field: keyof AngkaArusKas, pembatalan: boolean];

const SUMBER_MASUK: Sumber[] = [
  ["Penjualan", "penjualanMasuk", false],
  ["Saldo awal akun baru", "saldoAwalAkun", false],
  ["Beban", "bebanPembalik", true],
  ["Selisih kas lebih", "selisihKasMasuk", false],
  ["Pembelian stok", "pembelianPembalik", true],
];
const SUMBER_KELUAR: Sumber[] = [
  ["Pembelian stok", "pembelianKeluar", false],
  ["Beban", "bebanKeluar", false],
  ["Penjualan", "penjualanVoid", true],
  ["Selisih kas kurang", "selisihKasKeluar", false],
];
/** Transfer hanya dihitung backend untuk laporan satu akun kas. */
const TRANSFER_MASUK: Sumber[] = [
  ["Transfer masuk", "transferMasuk", false],
  ["Transfer keluar", "transferKeluarVoid", true],
];
const TRANSFER_KELUAR: Sumber[] = [
  ["Transfer keluar", "transferKeluar", false],
  ["Transfer masuk", "transferMasukVoid", true],
];

const angka = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Panel Uang masuk dan Uang keluar, baris diurutkan dari nilai terbesar.
 * Pembatalan masuk ke panel arah uangnya: VOID pembayaran mengurangi kas
 * (keluar), pembalik beban dan pembelian mengembalikannya (masuk), sama
 * dengan JENIS_MUTASI backend.
 */
export function rincianArusKas(ringkasan: AngkaArusKas, satuAkun: boolean): PanelRincian[] {
  const susun = (sumber: Sumber[]) =>
    sumber.map(([label, field, pembatalan]) => ({ label, nilai: angka(ringkasan[field]), pembatalan }));
  const masuk = susun(satuAkun ? [...SUMBER_MASUK, ...TRANSFER_MASUK] : SUMBER_MASUK);
  const keluar = susun(satuAkun ? [...SUMBER_KELUAR, ...TRANSFER_KELUAR] : SUMBER_KELUAR);
  const terbesar = Math.max(0, ...masuk.map((b) => b.nilai), ...keluar.map((b) => b.nilai));
  const panel = (judul: PanelRincian["judul"], daftar: Omit<BarisRincian, "persen">[]): PanelRincian => ({
    judul,
    total: daftar.reduce((n, b) => n + b.nilai, 0),
    baris: [...daftar]
      .sort((a, b) => b.nilai - a.nilai)
      .map((b) => ({ ...b, persen: terbesar > 0 ? (b.nilai / terbesar) * 100 : 0 })),
  });
  return [panel("Uang masuk", masuk), panel("Uang keluar", keluar)];
}

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const HARI_PENDEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** "YYYY-MM-DD" sebagai tanggal lokal, tanpa geser zona waktu. */
function bacaTanggal(teks: string): Date {
  const [t, b, h] = teks.split("-").map(Number);
  return new Date(t, (b ?? 1) - 1, h ?? 1);
}

/** "12 Nov" */
export function tanggalPendek(teks: string): string {
  const d = bacaTanggal(teks);
  return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}`;
}

/**
 * Label satu baris: "Kam, 12 Nov" per hari; per minggu dari Senin backend
 * sampai Minggu, dipangkas ke rentang ("2 sampai 8 Nov"); per bulan
 * "November 2026".
 */
export function labelBarisArusKas(tanggal: string, kelompok: KelompokArusKas, rentang: FilterArusKas): string {
  if (kelompok === "bulan") {
    const [t, b] = tanggal.split("-").map(Number);
    return `${BULAN_PANJANG[(b ?? 1) - 1]} ${t}`;
  }
  const awal = bacaTanggal(tanggal);
  if (kelompok === "hari") return `${HARI_PENDEK[awal.getDay()]}, ${tanggalPendek(tanggal)}`;
  const akhir = new Date(awal.getFullYear(), awal.getMonth(), awal.getDate() + 6);
  const mulai = awal < rentang.dari ? rentang.dari : awal;
  const selesai = akhir > rentang.sampai ? rentang.sampai : akhir;
  const kiri = keTanggalLokal(mulai);
  const kanan = keTanggalLokal(selesai);
  if (kiri === kanan) return tanggalPendek(kiri);
  const samaBulan = mulai.getMonth() === selesai.getMonth();
  return `${samaBulan ? mulai.getDate() : tanggalPendek(kiri)} sampai ${tanggalPendek(kanan)}`;
}

export interface BarisPeriode {
  kunci: string;
  label: string;
  masuk: number;
  keluar: number;
  bersih: number;
}

/** Uang masuk dan keluar satu baris, termasuk transfer bila backend menghitungnya. */
export function masukKeluar(b: AngkaArusKas): { masuk: number; keluar: number } {
  return {
    masuk:
      angka(b.penjualanMasuk) + angka(b.saldoAwalAkun) + angka(b.bebanPembalik) + angka(b.selisihKasMasuk) +
      angka(b.pembelianPembalik) + angka(b.transferMasuk) + angka(b.transferKeluarVoid),
    keluar:
      angka(b.pembelianKeluar) + angka(b.bebanKeluar) + angka(b.penjualanVoid) + angka(b.selisihKasKeluar) +
      angka(b.transferKeluar) + angka(b.transferMasukVoid),
  };
}

/** Baris per periode, terbaru lebih dulu; arus bersih dari backend. */
export function barisPeriode(baris: BarisArusKas[], filter: FilterArusKas): BarisPeriode[] {
  return [...baris]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .map((b) => ({
      kunci: b.tanggal,
      label: labelBarisArusKas(b.tanggal, filter.kelompok, filter),
      ...masukKeluar(b),
      bersih: angka(b.arusKasBersih),
    }));
}

export type Arah = "naik" | "turun" | "tetap";
export const arahBersih = (n: number): Arah => (n > 0 ? "naik" : n < 0 ? "turun" : "tetap");
export const LENCANA_ARAH: Record<Arah, { label: string; catatan: string }> = {
  naik: { label: "Naik", catatan: "masuk lebih besar dari keluar" },
  turun: { label: "Turun", catatan: "keluar lebih besar dari masuk" },
  tetap: { label: "Tetap", catatan: "masuk sama dengan keluar" },
};
