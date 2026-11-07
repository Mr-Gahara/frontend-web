/**
 * Fungsi murni tampilan Mesin Kasir dan riwayat buka-tutup kasir (keputusan
 * rancangan butir 10). Tidak memanggil API, sehingga komponen dan unit test
 * memakainya dengan data apa pun yang berbentuk tipe di types/sesiKasir.ts.
 */

import type { AkunKas } from "@/types/akunKas";
import type { PerangkatKasir, PerangkatPengguna, SesiKasir } from "@/types/sesiKasir";
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
 * "Sari, ditutup Ridho" bila berbeda. Respons tidak membawa asal penutupan
 * (web atau aplikasi), sehingga tidak ditulis (keputusan pemilik proyek,
 * 6 November 2026).
 */
export function orangSesi(sesi: Pick<SesiKasir, "dibukaOleh" | "ditutupOleh">): string {
  const pembuka = sesi.dibukaOleh?.nama ?? "-";
  const penutup = sesi.ditutupOleh;
  if (!penutup || penutup.id === sesi.dibukaOleh?.id) return pembuka;
  return `${pembuka}, ditutup ${penutup.nama}`;
}

export const NAMA_MESIN_TANPA_DAFTAR = "Mesin kasir";
export const NAMA_MESIN_DILEPAS = "Mesin kasir yang sudah dilepas";

/**
 * Nama mesin kasir untuk sebuah installationId. Daftar sesi tidak membawa
 * namaPerangkat, sehingga nama diambil dari daftar mesin kasir, yang hanya
 * terbaca pemegang kelola-perangkat-kasir; tanpa daftar itu (undefined) yang
 * tampil "Mesin kasir".
 */
export function namaMesin(
  installationId: string,
  daftar: readonly PerangkatKasir[] | undefined,
): string {
  if (!daftar) return NAMA_MESIN_TANPA_DAFTAR;
  return daftar.find((m) => m.installationId === installationId)?.namaPerangkat ?? NAMA_MESIN_DILEPAS;
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
  terakhirAktif: string | null;
  /** Nama mesin kasir bila perangkat ini sudah menjadi mesin kasir. */
  sudahMesin: string | null;
}

/**
 * Daftar perangkat untuk form tambah mesin kasir, digabung dari perangkat
 * setiap karyawan (keputusan pemilik proyek, 6 November 2026: backend belum
 * punya daftar perangkat se-toko). Satu baris per installationId, hanya yang
 * berstatus trusted (K-18: backend menerima perangkat berstatus apa pun),
 * diurutkan dari yang terakhir aktif.
 */
export function pilihanPerangkat(
  perangkat: readonly PerangkatPengguna[],
  mesin: readonly PerangkatKasir[],
): PilihanPerangkat[] {
  const peta = new Map<string, PilihanPerangkat>();
  for (const p of perangkat) {
    if (p.status !== "trusted") continue;
    const namaPemakai = p.pengguna?.nama;
    const ada = peta.get(p.installationId);
    if (!ada) {
      peta.set(p.installationId, {
        installationId: p.installationId,
        nama: p.deviceName?.trim() || NAMA_PERANGKAT_KOSONG,
        pemakai: namaPemakai ? [namaPemakai] : [],
        terakhirAktif: p.lastSeenAt,
        sudahMesin: mesin.find((m) => m.installationId === p.installationId)?.namaPerangkat ?? null,
      });
      continue;
    }
    if (namaPemakai && !ada.pemakai.includes(namaPemakai)) ada.pemakai.push(namaPemakai);
    if (ada.nama === NAMA_PERANGKAT_KOSONG && p.deviceName?.trim()) ada.nama = p.deviceName.trim();
    if (p.lastSeenAt && (!ada.terakhirAktif || p.lastSeenAt > ada.terakhirAktif)) {
      ada.terakhirAktif = p.lastSeenAt;
    }
  }
  return [...peta.values()].sort((a, b) =>
    (b.terakhirAktif ?? "").localeCompare(a.terakhirAktif ?? ""),
  );
}

/** Keterangan perangkat di form tambah mesin kasir. */
export function teksPerangkat(p: PilihanPerangkat, sekarang: Date): string {
  if (p.sudahMesin) return `Sudah jadi mesin kasir: ${p.sudahMesin}`;
  const oleh = p.pemakai.length ? `, oleh ${gabungNama(p.pemakai)}` : "";
  if (!p.terakhirAktif) return `Belum pernah aktif${oleh}`;
  return `Terakhir aktif ${waktuRelatif(p.terakhirAktif, sekarang)}${oleh}`;
}