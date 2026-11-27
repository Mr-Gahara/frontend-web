import { formatTanggalPendek } from "@/lib/format";
import type { SesiBookingResponse } from "@/types/sesiBooking";
import type { SesiKasir } from "@/types/sesiKasir";
import { bolehTautan, type AksesTautan } from "./akses";
import type { Pemberitahuan, TautanPemberitahuan } from "./jenis";

export const URL_MESIN_KASIR = "/dashboard/outlet/keuangan/mesinKasir";
const URL_PENJUALAN = "/dashboard/outlet/penjualan";
const POLA_DETAIL_PENJUALAN = "/dashboard/outlet/penjualan/[id]";
/** Tautan detail penjualan yang disebut kartu booking; sisanya diringkas. */
const BATAS_TAUTAN_BOOKING = 3;

const awalHari = (kini: Date) => new Date(kini.getFullYear(), kini.getMonth(), kini.getDate());

/**
 * Kasir lupa ditutup (LN4a, penting): sesi kasir berstatus BUKA yang dibuka
 * sebelum hari ini (tanggal lokal perangkat).
 */
export function pemberitahuanKasirLupa(sesiBuka: readonly SesiKasir[] | null, kini: Date, akses: AksesTautan): Pemberitahuan | null {
  if (!sesiBuka) return null;
  const lupa = sesiBuka.filter((s) => s.status === "BUKA" && new Date(s.dibukaPada) < awalHari(kini));
  if (lupa.length === 0) return null;
  const sebut = lupa
    .slice(0, 3)
    .map((s) => `${s.namaPerangkat ?? "mesin kasir"} (dibuka ${formatTanggalPendek(s.dibukaPada)})`)
    .join(", ");
  const sisa = lupa.length > 3 ? `, dan ${lupa.length - 3} lainnya` : "";
  return {
    id: "kasir-lupa",
    tingkat: "penting",
    judul: "Kasir lupa ditutup",
    isi: `${lupa.length} sesi kasir masih terbuka sejak hari sebelumnya: ${sebut}${sisa}. Tutup kasir agar setoran hari itu tercatat.`,
    tautan: bolehTautan(akses, URL_MESIN_KASIR) ? [{ href: URL_MESIN_KASIR, label: "Buka Mesin Kasir" }] : [],
  };
}

/**
 * Booking yang jamnya sudah lewat tetapi penjualannya belum lunas (LN4a,
 * perlu tindakan), dengan tautan ke detail penjualannya; lebih dari tiga
 * diringkas di kalimat.
 */
export function pemberitahuanBookingBelumLunas(
  booking: readonly SesiBookingResponse[] | null,
  kini: Date,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!booking) return null;
  const belum = booking.filter(
    (b) =>
      b.status !== "VOID" &&
      b.waktuSelesai !== null &&
      new Date(b.waktuSelesai) <= kini &&
      b.dataPenjualan !== null &&
      b.dataPenjualan.statusPenjualan !== "VOID" &&
      b.dataPenjualan.statusBayar !== "PAID",
  );
  if (belum.length === 0) return null;
  const tautan: TautanPemberitahuan[] = [];
  for (const b of belum.slice(0, BATAS_TAUTAN_BOOKING)) {
    const href = `${URL_PENJUALAN}/${b.dataPenjualan!.id}`;
    if (bolehTautan(akses, href, POLA_DETAIL_PENJUALAN)) {
      tautan.push({ href, label: b.dataAset?.namaAset ?? b.dataPenjualan!.noReferensi ?? "Detail penjualan" });
    }
  }
  const sisa = belum.length > BATAS_TAUTAN_BOOKING ? ` ${belum.length - BATAS_TAUTAN_BOOKING} lainnya ada di daftar penjualan.` : "";
  return {
    id: "booking-belum-lunas",
    tingkat: "tindakan",
    judul: "Booking selesai belum dibayar",
    isi: `${belum.length} booking hari ini sudah lewat jamnya, tetapi penjualannya belum lunas.${sisa}`,
    tautan,
  };
}
