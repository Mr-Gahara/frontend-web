/** Pemformat tampilan dashboard gudang. */
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { JurnalStok } from "@/types/jurnalStok";

const ANGKA = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** Angka bergaya Indonesia: 1.200, 1,5. */
export function formatAngka(nilai: number): string {
  return ANGKA.format(nilai);
}

/** "Senin, 19 Oktober 2026". */
export function formatHari(tanggal: Date): string {
  return format(tanggal, "EEEE, d MMMM yyyy", { locale: localeID });
}

/** "19 Okt, 10.42"; kosong atau tidak sah menjadi "-". */
export function formatWaktuSingkat(iso: string | null | undefined): string {
  if (!iso) return "-";
  const waktu = new Date(iso);
  return Number.isNaN(waktu.getTime()) ? "-" : format(waktu, "d MMM, HH.mm", { locale: localeID });
}

/** Jumlah jurnal bertanda arah dengan pemisah ribuan: "+0,5 liter", "−2.000 gram". */
export function teksJumlahRingkas(jurnal: Pick<JurnalStok, "tipeKoreksi" | "jumlah" | "bahanBakuID">): string {
  const tanda = jurnal.tipeKoreksi === "Masuk" ? "+" : "\u2212";
  return `${tanda}${formatAngka(jurnal.jumlah)} ${jurnal.bahanBakuID?.satuan || "unit"}`;
}

/** Lebar batang stok kritis; minimal 2% agar batang kosong tetap terlihat ujungnya. */
export function lebarBatang(isi: number): string {
  return `${Math.max(Math.round(isi * 100), 2)}%`;
}