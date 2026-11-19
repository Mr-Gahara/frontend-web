import { PANJANG_CARI_SERVER, queryCari, queryLingkup, type LingkupLokasi } from "@/features/inventaris/cakupan";
import type { PilFilter } from "@/lib/filter";
import type { StatusOpname } from "@/types/stockOpname";

/** Panjang cari terpanjang yang diterima backend (B108). */
export const PANJANG_CARI_OPNAME = PANJANG_CARI_SERVER;

/**
 * Query satu halaman GET /stockopname (paginasi B106, B108, B109): lokasi
 * atau tipe lokasi lingkup, status bila bukan Semua Status, dan pencarian
 * nomorOpname. Seluruhnya disaring server, sehingga pagination.total benar
 * (keputusan rancangan butir 27).
 */
export function paramHalamanOpname(
  lingkup: LingkupLokasi,
  status: StatusOpname | "ALL",
  cari: string,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return {
    page: String(halaman),
    limit: String(ukuran),
    ...queryLingkup(lingkup),
    ...(status !== "ALL" ? { status } : {}),
    ...queryCari(cari),
  };
}
/** Pilihan status di panel filter (FL10a: 5 pilihan berupa pil). */
export const OPSI_STATUS_OPNAME: { nilai: StatusOpname; label: string }[] = [
  { nilai: "DRAFT", label: "Draft" },
  { nilai: "SUBMITTED", label: "Menunggu Review" },
  { nilai: "APPROVED", label: "Disetujui" },
  { nilai: "REJECTED", label: "Ditolak" },
  { nilai: "CANCELLED", label: "Dibatalkan" },
];

/** Pil status aktif (FL4a); nomor opname kotak cari di bilah. */
export function pilFilterOpname(status: StatusOpname | "ALL", terapkan: (baru: StatusOpname | "ALL") => void): PilFilter[] {
  if (status === "ALL") return [];
  const label = OPSI_STATUS_OPNAME.find((o) => o.nilai === status)?.label ?? status;
  return [{ kunci: "status", label: `Status: ${label}`, onHapus: () => terapkan("ALL") }];
}
