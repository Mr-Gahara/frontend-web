import { SLUG_STATUS_URL } from "@/features/penjualan/filter-panel";
import { formatTanggalPendek } from "@/lib/format";
import type { Diskon } from "@/types/diskon";
import type { Membership } from "@/types/membership";
import { bolehTautan, type AksesTautan } from "./akses";
import type { Pemberitahuan, TautanPemberitahuan } from "./jenis";

const URL_PENJUALAN = "/dashboard/outlet/penjualan";
export const URL_MEMBERSHIP = "/dashboard/outlet/membership";
export const URL_DISKON = "/dashboard/outlet/diskon";
const SEHARI_MS = 86_400_000;
/** Membership yang kedaluwarsa dalam tujuh hari ke depan (LN4a). */
export const AMBANG_MEMBERSHIP_HARI = 7;
/** Diskon Aktif yang berakhir dalam tiga hari ke depan (LN4a). */
export const AMBANG_DISKON_HARI = 3;
const BATAS_NAMA = 3;

function sebut(nama: readonly string[]): string {
  const awal = nama.slice(0, BATAS_NAMA).join(", ");
  return nama.length > BATAS_NAMA ? `${awal}, dan ${nama.length - BATAS_NAMA} lainnya` : awal;
}

/**
 * Penjualan belum lunas dan lunas sebagian (LN4a, perlu tindakan), dengan
 * tautan ke daftar penjualan yang tersaring per status (LN9a, LN18a).
 */
export function pemberitahuanPenjualanBelumLunas(
  jumlah: { belumBayar: number | null; sebagian: number | null },
  akses: AksesTautan,
): Pemberitahuan | null {
  const belum = jumlah.belumBayar ?? 0;
  const sebagian = jumlah.sebagian ?? 0;
  if (belum + sebagian === 0) return null;
  const kalimat: string[] = [];
  const tautan: TautanPemberitahuan[] = [];
  const boleh = bolehTautan(akses, URL_PENJUALAN);
  if (belum > 0) {
    kalimat.push(`${belum} belum dibayar`);
    if (boleh) tautan.push({ href: `${URL_PENJUALAN}?status=${SLUG_STATUS_URL.UNPAID}`, label: "Belum bayar" });
  }
  if (sebagian > 0) {
    kalimat.push(`${sebagian} baru dibayar sebagian`);
    if (boleh) tautan.push({ href: `${URL_PENJUALAN}?status=${SLUG_STATUS_URL.PARTIAL}`, label: "Sebagian" });
  }
  return {
    id: "penjualan-belum-lunas",
    tingkat: "tindakan",
    judul: "Penjualan belum lunas",
    isi: `${belum + sebagian} penjualan belum lunas: ${kalimat.join(", ")}.`,
    tautan,
  };
}

/** Membership pelanggan yang kedaluwarsa dalam tujuh hari (LN4a, info), ke halaman Membership (LN10a). */
export function pemberitahuanMembershipBerakhir(
  membership: readonly Membership[] | null,
  kini: Date,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!membership) return null;
  const batas = kini.getTime() + AMBANG_MEMBERSHIP_HARI * SEHARI_MS;
  const segera = membership
    .filter((m) => m.status === "Aktif")
    .filter((m) => {
      const t = new Date(m.tanggalKadaluarsa).getTime();
      return t > kini.getTime() && t <= batas;
    })
    .sort((a, b) => a.tanggalKadaluarsa.localeCompare(b.tanggalKadaluarsa));
  if (segera.length === 0) return null;
  return {
    id: "membership-berakhir",
    tingkat: "info",
    judul: "Membership segera berakhir",
    isi: `${segera.length} membership pelanggan berakhir dalam ${AMBANG_MEMBERSHIP_HARI} hari: ${sebut(
      segera.map((m) => `${m.pelanggan?.namaPelanggan ?? "pelanggan"} (${formatTanggalPendek(m.tanggalKadaluarsa)})`),
    )}.`,
    tautan: bolehTautan(akses, URL_MEMBERSHIP) ? [{ href: URL_MEMBERSHIP, label: "Lihat membership" }] : [],
  };
}

/** Diskon Aktif yang berakhir dalam tiga hari, atau sudah lewat tetapi masih Aktif (LN4a, info). */
export function pemberitahuanDiskonBerakhir(
  diskon: readonly Diskon[] | null,
  kini: Date,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!diskon) return null;
  const batas = kini.getTime() + AMBANG_DISKON_HARI * SEHARI_MS;
  const aktif = diskon.filter((d) => d.status === "Aktif" && d.tanggalBerakhir);
  const lewat = aktif.filter((d) => new Date(d.tanggalBerakhir!).getTime() <= kini.getTime());
  const segera = aktif.filter((d) => {
    const t = new Date(d.tanggalBerakhir!).getTime();
    return t > kini.getTime() && t <= batas;
  });
  if (lewat.length + segera.length === 0) return null;
  const kalimat: string[] = [];
  if (segera.length) {
    kalimat.push(`${segera.length} diskon berakhir dalam ${AMBANG_DISKON_HARI} hari (${sebut(segera.map((d) => d.namaDiskon))})`);
  }
  if (lewat.length) {
    kalimat.push(`${lewat.length} diskon sudah lewat masa berlakunya tetapi masih Aktif (${sebut(lewat.map((d) => d.namaDiskon))})`);
  }
  return {
    id: "diskon-berakhir",
    tingkat: "info",
    judul: "Diskon segera berakhir",
    isi: `${kalimat.join("; ")}.`,
    tautan: bolehTautan(akses, URL_DISKON) ? [{ href: URL_DISKON, label: "Lihat diskon" }] : [],
  };
}
