import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

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