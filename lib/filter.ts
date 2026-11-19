import { format, isSameDay, startOfMonth, subDays } from "date-fns";
import { id as localeID } from "date-fns/locale";

/**
 * Aturan bersama bilah dan panel filter (keputusan FL1a sampai FL13a,
 * modul/ui-ux.md). Fungsi murni agar label pil dan periode cepat dapat
 * diuji tanpa merender halaman.
 */

export type JenisPeriodeCepat = "hari-ini" | "7-hari" | "bulan-ini";

export const PERIODE_CEPAT: { jenis: JenisPeriodeCepat; label: string }[] = [
  { jenis: "hari-ini", label: "Hari ini" },
  { jenis: "7-hari", label: "7 hari" },
  { jenis: "bulan-ini", label: "Bulan ini" },
];

export interface RentangTanggal {
  dari: Date | undefined;
  sampai: Date | undefined;
}

/** Rentang periode cepat, dihitung dari hari ini lokal (useTanggalHariIni, butir 28). */
export function rentangPeriodeCepat(jenis: JenisPeriodeCepat, hariIni: Date): { dari: Date; sampai: Date } {
  if (jenis === "hari-ini") return { dari: hariIni, sampai: hariIni };
  if (jenis === "7-hari") return { dari: subDays(hariIni, 6), sampai: hariIni };
  return { dari: startOfMonth(hariIni), sampai: hariIni };
}

/** Periode cepat yang cocok persis dengan rentang, atau null. */
export function periodeCepatTerpilih(rentang: RentangTanggal, hariIni: Date): JenisPeriodeCepat | null {
  const { dari, sampai } = rentang;
  if (!dari || !sampai) return null;
  for (const { jenis } of PERIODE_CEPAT) {
    const r = rentangPeriodeCepat(jenis, hariIni);
    if (isSameDay(r.dari, dari) && isSameDay(r.sampai, sampai)) return jenis;
  }
  return null;
}

const fmt = (d: Date, pola: string) => format(d, pola, { locale: localeID });

/**
 * Teks rentang untuk pil aktif: "1 – 19 Nov 2026", "28 Okt – 3 Nov 2026",
 * "30 Des 2025 – 2 Jan 2026", "Sejak 1 Nov 2026", atau "Sampai 19 Nov 2026".
 * Null bila keduanya kosong.
 */
export function labelRentang({ dari, sampai }: RentangTanggal): string | null {
  if (dari && sampai) {
    if (isSameDay(dari, sampai)) return fmt(dari, "d MMM yyyy");
    if (dari.getFullYear() !== sampai.getFullYear()) return `${fmt(dari, "d MMM yyyy")} – ${fmt(sampai, "d MMM yyyy")}`;
    if (dari.getMonth() !== sampai.getMonth()) return `${fmt(dari, "d MMM")} – ${fmt(sampai, "d MMM yyyy")}`;
    return `${fmt(dari, "d")} – ${fmt(sampai, "d MMM yyyy")}`;
  }
  if (dari) return `Sejak ${fmt(dari, "d MMM yyyy")}`;
  if (sampai) return `Sampai ${fmt(sampai, "d MMM yyyy")}`;
  return null;
}

/** Label pil periode: nama periode cepat bila cocok, diikuti rentangnya. */
export function labelPilPeriode(rentang: RentangTanggal, hariIni: Date): string | null {
  const teks = labelRentang(rentang);
  if (!teks) return null;
  const cepat = periodeCepatTerpilih(rentang, hariIni);
  const nama = PERIODE_CEPAT.find((p) => p.jenis === cepat)?.label;
  return nama ? `${nama} · ${teks}` : teks;
}

/** Pil filter aktif di bawah bilah (FL4a). */
export interface PilFilter {
  kunci: string;
  label: string;
  onHapus: () => void;
}

/** Dua rentang sama per hari; dipakai untuk periode bawaan yang tidak dihitung (FL11a). */
export function rentangSama(a: RentangTanggal, b: RentangTanggal): boolean {
  const sama = (x?: Date, y?: Date) => (x && y ? isSameDay(x, y) : !x && !y);
  return sama(a.dari, b.dari) && sama(a.sampai, b.sampai);
}
