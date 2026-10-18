import { keTanggalLokal } from "@/lib/waktu";
import type { AkunKas } from "@/types/akunKas";
import type {
  AkunKasBeban,
  BebanOperasional,
  KategoriDiBeban,
  PayloadBatalBeban,
  PayloadBuatBeban,
  PayloadUbahBeban,
  StatusBeban,
} from "@/types/bebanOperasional";
import type { IsianCatatBeban, IsianUbahBeban } from "./schema";

export const URL_PENGELUARAN = "/dashboard/outlet/pengeluaran";
export const URL_CATAT_BEBAN = "/dashboard/outlet/pengeluaran/catatBeban";

/** Batas alasan VOID di validator backend (PANJANG_ALASAN_VOID). */
export const PANJANG_ALASAN_BATAL = 500;

export function isianAwalCatat(hariIni: string): IsianCatatBeban {
  return { akunKasID: "", kategoriBebanID: "", jumlah: "", tanggal: hariIni, keterangan: "" };
}

/**
 * Body POST /bebanoperasional. Owner mengirim tanggal pilihannya, peran lain
 * selalu hari ini (keputusan BO5a, P23 backend). Backend ridho 00de455 belum
 * menegakkan aturan itu untuk beban, sehingga web menahannya lebih dulu.
 */
export function payloadBuatBeban(
  isian: IsianCatatBeban,
  owner: boolean,
  hariIni: string,
): PayloadBuatBeban {
  return {
    akunKasID: isian.akunKasID,
    kategoriBebanID: isian.kategoriBebanID,
    jumlah: Number(isian.jumlah.trim()),
    tanggal: owner ? isian.tanggal : hariIni,
    keterangan: isian.keterangan.trim(),
  };
}

/**
 * Pesan bila jumlah melebihi saldo akun kas yang termuat, atau null. Hanya
 * penahan di form: backend tetap memeriksa saldo secara atomik (409).
 */
export function pesanSaldoKurang(jumlahTeks: string, akun: AkunKas | undefined): string | null {
  const jumlah = Number(jumlahTeks.trim());
  if (!akun || !Number.isFinite(jumlah)) return null;
  return jumlah > akun.saldo ? "Jumlah melebihi saldo akun kas." : null;
}

export function isianAwalUbah(beban: BebanOperasional): IsianUbahBeban {
  return { kategoriBebanID: beban.kategori?.id ?? "", keterangan: beban.keterangan ?? "" };
}

/**
 * Body PUT ubah: hanya field yang berubah dibanding data server (keputusan
 * rancangan butir 15). Spasi di tepi bukan perubahan. Objek kosong berarti
 * tidak ada perubahan, dan backend menolak PUT tanpa field.
 */
export function payloadUbahBeban(beban: BebanOperasional, isian: IsianUbahBeban): PayloadUbahBeban {
  const payload: PayloadUbahBeban = {};
  const keterangan = isian.keterangan.trim();
  if (keterangan !== (beban.keterangan ?? "").trim()) payload.keterangan = keterangan;
  if (isian.kategoriBebanID && isian.kategoriBebanID !== beban.kategori?.id) {
    payload.kategoriBebanID = isian.kategoriBebanID;
  }
  return payload;
}

/** Alasan VOID wajib dan paling panjang 500 setelah dipangkas; null berarti sah. */
export function pesanAlasanBatal(alasan: string): string | null {
  const teks = alasan.trim();
  if (teks === "") return "Alasan pembatalan wajib diisi.";
  if (teks.length > PANJANG_ALASAN_BATAL) {
    return `Alasan pembatalan maksimal ${PANJANG_ALASAN_BATAL} karakter.`;
  }
  return null;
}

export function payloadBatalBeban(alasan: string): PayloadBatalBeban {
  return { status: "VOID", alasanVoid: alasan.trim() };
}

export type FilterBeban = {
  akunKasID: string;
  kategoriBebanID: string;
  status: "" | StatusBeban;
  /** Periode atas tanggal beban; kosong berarti tanpa batas. */
  dari?: Date;
  sampai?: Date;
};

export const FILTER_AWAL_BEBAN: FilterBeban = { akunKasID: "", kategoriBebanID: "", status: "" };

/**
 * Query GET /bebanoperasional: hanya filter yang diisi. Periode dikirim
 * sebagai YYYY-MM-DD, yang dibaca backend sebagai hari WIB atas tanggal
 * beban. Backend menolak query di luar status, akunKasID, kategoriBebanID,
 * dari, sampai, page, dan limit dengan 400.
 */
export function filterServerBeban(filter: FilterBeban): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.akunKasID) params.akunKasID = filter.akunKasID;
  if (filter.kategoriBebanID) params.kategoriBebanID = filter.kategoriBebanID;
  if (filter.status) params.status = filter.status;
  if (filter.dari) params.dari = keTanggalLokal(filter.dari);
  if (filter.sampai) params.sampai = keTanggalLokal(filter.sampai);
  return params;
}

export function adaFilterBeban(filter: FilterBeban): boolean {
  return Object.keys(filterServerBeban(filter)).length > 0;
}

export const LABEL_STATUS_BEBAN: Record<StatusBeban, string> = {
  AKTIF: "Aktif",
  VOID: "Dibatalkan",
};

export function namaAkunBeban(akun: AkunKasBeban | null): string {
  return akun?.namaAkun || "-";
}

export function namaKategoriBeban(kategori: KategoriDiBeban | null): string {
  return kategori?.namaKategori || "-";
}