import type { PengingatLangganan } from "@/features/langganan/pengingat";
import { bolehTautan, type AksesTautan } from "./akses";
import type { Pemberitahuan } from "./jenis";

export const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";

/**
 * Pengingat masa langganan (TP8a) sebagai pemberitahuan: masa tenggang
 * penting, hampir habis perlu tindakan (LN11a). Bilahnya tetap (LN12a).
 */
export function pemberitahuanLangganan(
  pengingat: PengingatLangganan | null,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!pengingat) return null;
  return {
    id: "langganan",
    tingkat: pengingat.jenis === "tenggang" ? "penting" : "tindakan",
    judul: pengingat.judul,
    isi: pengingat.isi,
    tautan: bolehTautan(akses, URL_LANGGANAN) ? [{ href: URL_LANGGANAN, label: "Lihat langganan" }] : [],
    persen: pengingat.persen,
  };
}
