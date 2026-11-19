import type { JenisPenjualan, JenisTransaksi, PenjualanFilterParams } from "@/types/penjualan";
import { labelPilPeriode, type PilFilter } from "@/lib/filter";
import { dariTanggalLokal } from "@/lib/waktu";
import { TAMPILAN_STATUS_PENJUALAN } from "./tampilan";

/**
 * Isian panel filter daftar penjualan (FL1a, FL10a). Nomor referensi tidak
 * termasuk: ia kotak cari di bilah dan berlaku sendiri.
 */
export type FilterPanelPenjualan = Pick<
  PenjualanFilterParams,
  "statusPenjualan" | "jenisTransaksi" | "jenisPenjualan" | "startDate" | "endDate"
>;

/** Tanpa periode bawaan: daftar penjualan memuat semua tanggal. */
export const FILTER_KOSONG: FilterPanelPenjualan = {
  statusPenjualan: undefined,
  jenisTransaksi: undefined,
  jenisPenjualan: undefined,
  startDate: "",
  endDate: "",
};

export const OPSI_TIPE_TRANSAKSI: { nilai: JenisTransaksi; label: string }[] = [
  { nilai: "POS", label: "POS Kasir" },
  { nilai: "INVOICE", label: "Invoice Online" },
];

export const OPSI_METODE_PENJUALAN: { nilai: JenisPenjualan; label: string }[] = [
  { nilai: "dine-in", label: "Dine-in" },
  { nilai: "takeaway", label: "Takeaway" },
  { nilai: "booking", label: "Booking" },
];

const adaPeriode = (f: FilterPanelPenjualan) => Boolean(f.startDate || f.endDate);

/** Jumlah filter aktif untuk lencana; periode dihitung satu. */
export function jumlahFilterAktif(f: FilterPanelPenjualan): number {
  return [f.statusPenjualan, f.jenisTransaksi, f.jenisPenjualan].filter(Boolean).length + (adaPeriode(f) ? 1 : 0);
}

/** Pil filter aktif; menghapus satu pil menerapkan filter tanpa isian itu. */
export function pilFilterPenjualan(
  f: FilterPanelPenjualan,
  hariIni: Date,
  terapkan: (nilai: FilterPanelPenjualan) => void,
): PilFilter[] {
  const pil: PilFilter[] = [];
  if (f.statusPenjualan) {
    pil.push({
      kunci: "status",
      label: `Status: ${TAMPILAN_STATUS_PENJUALAN[f.statusPenjualan]?.label ?? f.statusPenjualan}`,
      onHapus: () => terapkan({ ...f, statusPenjualan: undefined }),
    });
  }
  if (f.jenisTransaksi) {
    const label = OPSI_TIPE_TRANSAKSI.find((o) => o.nilai === f.jenisTransaksi)?.label ?? f.jenisTransaksi;
    pil.push({ kunci: "tipe", label: `Tipe: ${label}`, onHapus: () => terapkan({ ...f, jenisTransaksi: undefined }) });
  }
  if (f.jenisPenjualan) {
    const label = OPSI_METODE_PENJUALAN.find((o) => o.nilai === f.jenisPenjualan)?.label ?? f.jenisPenjualan;
    pil.push({ kunci: "metode", label: `Metode: ${label}`, onHapus: () => terapkan({ ...f, jenisPenjualan: undefined }) });
  }
  const periode = labelPilPeriode(
    { dari: dariTanggalLokal(f.startDate), sampai: dariTanggalLokal(f.endDate) },
    hariIni,
  );
  if (periode) {
    pil.push({ kunci: "periode", label: periode, onHapus: () => terapkan({ ...f, startDate: "", endDate: "" }) });
  }
  return pil;
}
