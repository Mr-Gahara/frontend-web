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