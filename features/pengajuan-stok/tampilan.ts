import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

export function formatTanggalPengajuan(iso: string | null | undefined): string {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: localeID });
}