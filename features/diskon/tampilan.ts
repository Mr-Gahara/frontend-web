import type { PilFilter } from "@/lib/filter";
import type { Diskon, DiskonCakupan, DiskonStatus, DiskonTipe } from "@/types/diskon";

/**
 * Nilai field aturan untuk diskon tanpa aturan tambahan, sama dengan bawaan
 * model backend. Dipakai pembentuk objek di test.
 */
export const ATURAN_DISKON_KOSONG = {
  produkIDs: [],
  tanggalMulai: null,
  tanggalBerakhir: null,
  hitungPerBarang: false,
  minimalBelanja: 0,
  kuota: null,
  terpakai: 0,
  sisaKuota: null,
  khususMember: false,
  kuotaPerPelanggan: null,
  jamMulai: null,
  jamSelesai: null,
  hariAktif: [],
  sedangBerlaku: true,
} satisfies Partial<Diskon>;

/** Batas diskon berstatus Aktif per toko di backend (BATAS_DISKON_AKTIF). */
export const BATAS_DISKON_AKTIF = 50;

/** Masih boleh mengaktifkan diskon; di luar batas, diskon baru hanya dapat disimpan Non-Aktif (PD2a, NZ5a). */
export function masihDalamBatas(daftar: Diskon[]): boolean {
  return daftar.filter((d) => d.status === "Aktif").length < BATAS_DISKON_AKTIF;
}

export interface FilterDiskon {
  status: DiskonStatus | "all";
  cakupan: DiskonCakupan | "all";
  tipe: DiskonTipe | "all";
}

export const FILTER_DISKON_AWAL: FilterDiskon = { status: "all", cakupan: "all", tipe: "all" };

/**
 * Penyaringan daftar di klien, dari satu cache daftar diskon. cari nama
 * diskon tanpa peka huruf besar, sama dengan pencarian DataTable sebelumnya;
 * kotak carinya kini di bilah filter (FL1a).
 */
export function saringDiskon(daftar: Diskon[], filter: FilterDiskon, cari = ""): Diskon[] {
  const kata = cari.trim().toLowerCase();
  return daftar.filter(
    (d) =>
      (filter.status === "all" || d.status === filter.status) &&
      (filter.cakupan === "all" || d.cakupan === filter.cakupan) &&
      (filter.tipe === "all" || d.tipe === filter.tipe) &&
      (!kata || d.namaDiskon.toLowerCase().includes(kata)),
  );
}

export function teksNilai(diskon: Pick<Diskon, "tipe" | "nilai">): string {
  return diskon.tipe === "persen"
    ? `${diskon.nilai}%`
    : `Rp ${diskon.nilai.toLocaleString("id-ID")}`;
}

const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const teksTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

/**
 * Aturan tambahan sebuah diskon sebagai daftar kalimat pendek, untuk kolom
 * aturan di daftar (keputusan PD3a). Kosong bila diskon tanpa aturan.
 */
export function ringkasAturan(diskon: Diskon): string[] {
  const aturan: string[] = [];
  if (diskon.tanggalMulai || diskon.tanggalBerakhir) {
    const mulai = diskon.tanggalMulai ? `mulai ${teksTanggal(diskon.tanggalMulai)}` : "";
    const akhir = diskon.tanggalBerakhir ? `sampai ${teksTanggal(diskon.tanggalBerakhir)}` : "";
    aturan.push(["Berlaku", mulai, akhir].filter(Boolean).join(" "));
  }
  if (diskon.jamMulai && diskon.jamSelesai) {
    aturan.push(`Jam ${diskon.jamMulai} sampai ${diskon.jamSelesai}`);
  }
  if (diskon.hariAktif.length > 0) {
    aturan.push(`Hari ${diskon.hariAktif.map((h) => NAMA_HARI[h] ?? String(h)).join(", ")}`);
  }
  if (diskon.minimalBelanja > 0) {
    aturan.push(`Minimal belanja Rp ${diskon.minimalBelanja.toLocaleString("id-ID")}`);
  }
  if (diskon.kuota !== null) {
    aturan.push(`Kuota ${diskon.sisaKuota ?? 0} dari ${diskon.kuota} tersisa`);
  }
  if (diskon.kuotaPerPelanggan !== null) {
    aturan.push(`Maksimal ${diskon.kuotaPerPelanggan} kali per pelanggan`);
  }
  if (diskon.khususMember) aturan.push("Khusus member");
  if (diskon.produkIDs.length > 0) aturan.push(`${diskon.produkIDs.length} produk tertentu`);
  if (diskon.hitungPerBarang) aturan.push("Dihitung per barang");
  return aturan;
}

/** Diskon berstatus Aktif yang menurut backend tidak dapat dipakai saat ini. */
export function aktifTetapiTidakBerlaku(diskon: Diskon): boolean {
  return diskon.status === "Aktif" && !diskon.sedangBerlaku;
}
/**
 * Syarat pemakaian yang bergantung pada transaksi, untuk ditampilkan di
 * pilihan diskon kasir (keputusan PD4a). Backend yang menegakkannya saat
 * penjualan atau booking disimpan.
 */
export function syaratPemakaian(diskon: Diskon): string[] {
  const syarat: string[] = [];
  if (diskon.minimalBelanja > 0) {
    syarat.push(`Minimal belanja Rp ${diskon.minimalBelanja.toLocaleString("id-ID")}`);
  }
  if (diskon.produkIDs.length > 0) syarat.push(`${diskon.produkIDs.length} produk tertentu`);
  if (diskon.kuotaPerPelanggan !== null) {
    syarat.push(`Maksimal ${diskon.kuotaPerPelanggan} kali per pelanggan`);
  }
  if (diskon.khususMember) syarat.push("Khusus member");
  return syarat;
}

/** Opsi panel filter diskon (FL10a: masing-masing dua pilihan, berupa segmen). */
export const OPSI_FILTER_DISKON = {
  status: [
    { nilai: "Aktif", label: "Aktif" },
    { nilai: "Non-Aktif", label: "Non-Aktif" },
  ],
  cakupan: [
    { nilai: "Global", label: "Global" },
    { nilai: "Item", label: "Item" },
  ],
  tipe: [
    { nilai: "persen", label: "Persen" },
    { nilai: "nominal", label: "Nominal" },
  ],
} as const satisfies Record<keyof FilterDiskon, readonly { nilai: string; label: string }[]>;

export function jumlahFilterDiskon(filter: FilterDiskon): number {
  return [filter.status, filter.cakupan, filter.tipe].filter((v) => v !== "all").length;
}

/** Pil filter aktif diskon (FL4a). */
export function pilFilterDiskon(filter: FilterDiskon, terapkan: (baru: FilterDiskon) => void): PilFilter[] {
  const judul: Record<keyof FilterDiskon, string> = { status: "Status", cakupan: "Cakupan", tipe: "Tipe" };
  return (Object.keys(judul) as (keyof FilterDiskon)[])
    .filter((k) => filter[k] !== "all")
    .map((k) => ({
      kunci: k,
      label: `${judul[k]}: ${OPSI_FILTER_DISKON[k].find((o) => o.nilai === filter[k])?.label ?? filter[k]}`,
      onHapus: () => terapkan({ ...filter, [k]: "all" }),
    }));
}
