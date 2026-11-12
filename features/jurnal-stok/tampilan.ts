import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { JurnalStok } from "@/types/jurnalStok";

export function formatWaktuJurnal(iso: string | null | undefined): {
  tanggal: string;
  jam: string;
} {
  if (!iso) return { tanggal: "-", jam: "-" };
  const waktu = new Date(iso);
  return {
    tanggal: format(waktu, "dd MMM yyyy", { locale: localeID }),
    jam: format(waktu, "HH:mm", { locale: localeID }),
  };
}

/** Jumlah bertanda arah beserta satuan bahannya, misalnya "+20 kg" atau "-2 liter". */
export function teksJumlahJurnal(
  jurnal: Pick<JurnalStok, "tipeKoreksi" | "jumlah" | "bahanBakuID">,
): string {
  const tanda = jurnal.tipeKoreksi === "Masuk" ? "+" : "-";
  return `${tanda}${jurnal.jumlah} ${jurnal.bahanBakuID?.satuan || "unit"}`;
}
const POLA_NO_REFERENSI = /^Penjualan (\S+?):/;

/**
 * Tautan dialog rincian ke penjualan pemotong stok (pemilik proyek,
 * 12 November 2026), hanya untuk jurnal beralasan Penjualan yang membawa
 * penjualanID (B319). penjualanID tidak di-populate, sehingga nomor
 * referensi dibaca dari keterangan bawaan backend
 * "Penjualan <noReferensi>: <produk> x<jumlah>"; keterangan yang sudah
 * diubah (P24) jatuh ke "Lihat penjualan", seperti tautan mutasi kas.
 */
export function tautanPenjualanJurnal(
  jurnal: Pick<JurnalStok, "alasan" | "penjualanID" | "keterangan">,
): { url: string; teks: string } | null {
  if (jurnal.alasan !== "Penjualan" || !jurnal.penjualanID) return null;
  const noReferensi = POLA_NO_REFERENSI.exec(jurnal.keterangan ?? "")?.[1];
  return {
    url: `/dashboard/outlet/penjualan/${jurnal.penjualanID}`,
    teks: noReferensi ? `Lihat penjualan ${noReferensi}` : "Lihat penjualan",
  };
}
