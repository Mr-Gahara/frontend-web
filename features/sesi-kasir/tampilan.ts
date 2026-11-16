/**
 * Fungsi murni tampilan Mesin Kasir dan riwayat buka-tutup kasir (keputusan
 * rancangan butir 10). Tidak memanggil API, sehingga komponen dan unit test
 * memakainya dengan data apa pun yang berbentuk tipe di types/sesiKasir.ts.
 */

import type { AkunKas } from "@/types/akunKas";
import type { PerangkatKasir, PerangkatToko, SesiKasir } from "@/types/sesiKasir";
import { formatRupiah } from "@/lib/format";
import { keTanggalLokal } from "@/lib/waktu";

export type NadaSelisih = "pas" | "lebih" | "kurang" | "kosong";

export interface LabelSelisih {
  teks: string;
  nada: NadaSelisih;
}

/**
 * Selisih hitungan kasir terhadap catatan sistem. Positif berarti uang di
 * laci lebih banyak dari catatan, negatif berarti kurang, dan null berarti
 * belum ada hitungan (kasir belum ditutup).
 */
export function labelSelisih(selisih: number | null | undefined): LabelSelisih {
  if (selisih === null || selisih === undefined) return { teks: "-", nada: "kosong" };
  if (selisih === 0) return { teks: "Pas", nada: "pas" };
  if (selisih > 0) return { teks: `Lebih ${formatRupiah(selisih)}`, nada: "lebih" };
  return { teks: `Kurang ${formatRupiah(-selisih)}`, nada: "kurang" };
}

const FORMAT_JAM = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const FORMAT_TANGGAL_SINGKAT = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const FORMAT_HARI_PANJANG = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const FORMAT_HARI_PENDEK = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Jam lokal, misalnya "08.05". */
export const jamLokal = (iso: string): string => FORMAT_JAM.format(new Date(iso));

/**
 * Jam buka sampai tutup. Sesi yang ditutup di hari berikutnya (kedai yang
 * buka sampai dini hari) diberi tanggal tutupnya; sesi yang belum ditutup
 * berakhir "sekarang".
 */
export function rentangJam(sesi: Pick<SesiKasir, "dibukaPada" | "ditutupPada">): string {
  const buka = jamLokal(sesi.dibukaPada);
  if (!sesi.ditutupPada) return `${buka} sampai sekarang`;
  const tutup = jamLokal(sesi.ditutupPada);
  const hariSama =
    keTanggalLokal(new Date(sesi.dibukaPada)) === keTanggalLokal(new Date(sesi.ditutupPada));
  return hariSama
    ? `${buka} sampai ${tutup}`
    : `${buka} sampai ${tutup} (${FORMAT_TANGGAL_SINGKAT.format(new Date(sesi.ditutupPada))})`;
}

/** Lama kasir sudah buka, misalnya "5 jam 41 menit". */
export function lamaBuka(dibukaPada: string, sekarang: Date): string {
  const menit = Math.floor((sekarang.getTime() - new Date(dibukaPada).getTime()) / 60_000);
  if (!Number.isFinite(menit) || menit < 1) return "kurang dari 1 menit";
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return `${sisa} menit`;
  if (sisa === 0) return `${jam} jam`;
  return `${jam} jam ${sisa} menit`;
}

/**
 * Waktu relatif terhadap hari ini: "hari ini 08.10", "kemarin 22.05", atau
 * tanggal saja untuk hari yang lebih lama ("2 Nov 2026").
 */
export function waktuRelatif(iso: string, sekarang: Date): string {
  const t = new Date(iso);
  const kunci = keTanggalLokal(t);
  if (kunci === keTanggalLokal(sekarang)) return `hari ini ${jamLokal(iso)}`;
  const kemarin = new Date(sekarang);
  kemarin.setDate(kemarin.getDate() - 1);
  if (kunci === keTanggalLokal(kemarin)) return `kemarin ${jamLokal(iso)}`;
  return FORMAT_TANGGAL.format(t);
}

/** Daftar nama berbahasa Indonesia: "Sari", "Sari dan Ridho", "Sari, Ridho, dan Budi". */
export function gabungNama(nama: readonly string[]): string {
  if (nama.length === 0) return "-";
  if (nama.length === 1) return nama[0];
  if (nama.length === 2) return `${nama[0]} dan ${nama[1]}`;
  return `${nama.slice(0, -1).join(", ")}, dan ${nama[nama.length - 1]}`;
}

/**
 * Orang di sebuah sesi: pembuka saja bila penutupnya sama atau belum ada,
 * "Sari, ditutup Ridho" bila berbeda. Penutupan dari web (ditutupDari, B336)
 * ditulis "Sari, ditutup Ridho dari web", dan "Ridho, ditutup dari web" bila
 * penutupnya orang yang sama; dari aplikasi atau sesi lama tanpa asal tidak
 * ditulis asalnya (MK5b, pemilik proyek 16 November 2026).
 */
export function orangSesi(
  sesi: Pick<SesiKasir, "dibukaOleh" | "ditutupOleh" | "ditutupDari">,
): string {
  const pembuka = sesi.dibukaOleh?.nama ?? "-";
  const penutup = sesi.ditutupOleh;
  const dariWeb = sesi.ditutupDari === "web";
  if (!penutup || penutup.id === sesi.dibukaOleh?.id) {
    return dariWeb ? `${pembuka}, ditutup dari web` : pembuka;
  }
  return `${pembuka}, ditutup ${penutup.nama}${dariWeb ? " dari web" : ""}`;
}

export const NAMA_MESIN_DILEPAS = "Mesin kasir yang sudah dilepas";

/**
 * Nama mesin kasir sebuah sesi, dari namaPerangkat respons (B335), yang
 * terbaca setiap pemegang read-sesi-kasir; null berarti pemetaan mesinnya
 * sudah dilepas.
 */
export function namaMesin(sesi: Pick<SesiKasir, "namaPerangkat">): string {
  return sesi.namaPerangkat ?? NAMA_MESIN_DILEPAS;
}

export interface KelompokHari<T> {
  kunci: string;
  /** "Kamis, 5 November 2026", untuk desktop. */
  judul: string;
  /** "Kamis, 5 Nov 2026", untuk HP. */
  judulPendek: string;
  sesi: T[];
}

/**
 * Mengelompokkan sesi per tanggal lokal waktu buka, dengan urutan masukan
 * dipertahankan (backend mengurutkan dibukaPada menurun).
 */
export function kelompokkanPerHari<T extends Pick<SesiKasir, "dibukaPada">>(
  daftar: readonly T[],
): KelompokHari<T>[] {
  const hasil: KelompokHari<T>[] = [];
  for (const sesi of daftar) {
    const tanggal = new Date(sesi.dibukaPada);
    const kunci = keTanggalLokal(tanggal);
    let kelompok = hasil.find((k) => k.kunci === kunci);
    if (!kelompok) {
      kelompok = {
        kunci,
        judul: FORMAT_HARI_PANJANG.format(tanggal),
        judulPendek: FORMAT_HARI_PENDEK.format(tanggal),
        sesi: [],
      };
      hasil.push(kelompok);
    }
    kelompok.sesi.push(sesi);
  }
  return hasil;
}

/** Keterangan terakhir dipakai di daftar mesin kasir, dari sesi terbarunya. */
export function teksTerakhirDipakai(
  sesi: Pick<SesiKasir, "status" | "dibukaPada" | "ditutupPada" | "dibukaOleh" | "ditutupOleh"> | null,
  sekarang: Date,
): string {
  if (!sesi) return "Belum pernah dipakai";
  if (sesi.status === "BUKA" || !sesi.ditutupPada) {
    return `Dibuka ${waktuRelatif(sesi.dibukaPada, sekarang)} oleh ${sesi.dibukaOleh?.nama ?? "-"}`;
  }
  return `Ditutup ${waktuRelatif(sesi.ditutupPada, sekarang)} oleh ${sesi.ditutupOleh?.nama ?? "-"}`;
}

/** Label laci dengan nomor akun bila ada: "kasir outlet (KAS-002)". */
export const labelAkun = (akun: Pick<AkunKas, "namaAkun" | "nomorAkun">): string =>
  akun.nomorAkun ? `${akun.namaAkun} (${akun.nomorAkun})` : akun.namaAkun;

/**
 * Label laci sebuah mesin kasir. Respons mesin kasir hanya membawa namaAkun,
 * sehingga nomor akun diambil dari daftar akun kas bila tersedia.
 */
export function labelLaci(
  mesin: Pick<PerangkatKasir, "akunKasID" | "akunKas">,
  akunKas: readonly AkunKas[] | undefined,
): string {
  const akun = akunKas?.find((a) => a.id === mesin.akunKasID);
  if (akun) return labelAkun(akun);
  return mesin.akunKas?.namaAkun ?? "-";
}

export interface PilihanLaci {
  id: string;
  label: string;
  /** Nama mesin kasir lain yang sudah memakai laci ini. */
  dipakaiOleh: string | null;
}

/**
 * Pilihan laci untuk form mesin kasir: hanya akun Kas Fisik yang aktif
 * (sesiKasirService.tetapkanPerangkat). Satu laci untuk satu mesin (indeks
 * unik tenantID dan akunKasID), sehingga laci milik mesin lain ditandai;
 * laci mesin yang sedang diubah sendiri tidak dihitung terpakai.
 */
export function pilihanLaci(
  akunKas: readonly AkunKas[],
  mesin: readonly PerangkatKasir[],
  installationIdSendiri?: string,
): PilihanLaci[] {
  return akunKas
    .filter((a) => a.tipeAkun === "Kas Fisik" && a.status === "aktif")
    .map((a) => ({
      id: a.id,
      label: labelAkun(a),
      dipakaiOleh:
        mesin.find((m) => m.akunKasID === a.id && m.installationId !== installationIdSendiri)
          ?.namaPerangkat ?? null,
    }));
}

export const NAMA_PERANGKAT_KOSONG = "Perangkat tanpa nama";

export interface PilihanPerangkat {
  installationId: string;
  nama: string;
  pemakai: string[];
  terakhirDipakai: string | null;
  /** Nama mesin kasir bila perangkat ini sudah menjadi mesin kasir. */
  sudahMesin: string | null;
}

/**
 * Daftar perangkat untuk form tambah mesin kasir, dari perangkat trusted
 * se-toko (B334; MK3b, pemilik proyek 16 November 2026), diurutkan dari yang
 * terakhir dipakai.
 */
export function pilihanPerangkat(perangkat: readonly PerangkatToko[]): PilihanPerangkat[] {
  return perangkat
    .map((p) => ({
      installationId: p.installationId,
      nama: p.deviceName?.trim() || NAMA_PERANGKAT_KOSONG,
      pemakai: [...new Set(p.pengguna.map((u) => u.nama))],
      terakhirDipakai: p.terakhirDipakai,
      sudahMesin: p.mesinKasir?.namaPerangkat ?? null,
    }))
    .sort((a, b) => (b.terakhirDipakai ?? "").localeCompare(a.terakhirDipakai ?? ""));
}

/** Keterangan perangkat di form tambah mesin kasir. */
export function teksPerangkat(p: PilihanPerangkat, sekarang: Date): string {
  if (p.sudahMesin) return `Sudah jadi mesin kasir: ${p.sudahMesin}`;
  const oleh = p.pemakai.length ? `, oleh ${gabungNama(p.pemakai)}` : "";
  if (!p.terakhirDipakai) return `Belum pernah dipakai${oleh}`;
  return `Terakhir dipakai ${waktuRelatif(p.terakhirDipakai, sekarang)}${oleh}`;
}