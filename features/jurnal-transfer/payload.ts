import type { AkunKas } from "@/types/akunKas";
import type {
  AkunTransfer,
  PayloadBatalTransfer,
  PayloadBuatTransfer,
  StatusTransfer,
} from "@/types/jurnalTransfer";
import type { IsianPindahDana } from "./schema";

export const URL_PINDAH_DANA = "/dashboard/outlet/keuangan/akunkas/pindahDana";

export const ISIAN_AWAL_PINDAH_DANA: IsianPindahDana = {
  kasSumberID: "",
  kasTujuanID: "",
  jumlah: "",
  keterangan: "",
};

/** Keempat field FIELD_CREATE yang dipakai web; tanggal tidak dikirim (DN3a). */
export function payloadBuatTransfer(isian: IsianPindahDana): PayloadBuatTransfer {
  return {
    kasSumberID: isian.kasSumberID,
    kasTujuanID: isian.kasTujuanID,
    jumlah: Number(isian.jumlah.trim()),
    keterangan: isian.keterangan.trim(),
  };
}

/** Pembatalan: status VOID, dan catatan hanya bila alasan diisi. */
export function payloadBatalTransfer(alasan: string): PayloadBatalTransfer {
  const catatan = alasan.trim();
  return catatan === "" ? { status: "VOID" } : { status: "VOID", catatan };
}

/**
 * Pesan bila jumlah melebihi saldo akun sumber yang termuat, atau null.
 * Hanya penahan di form: backend tetap memeriksa saldo secara atomik.
 */
export function pesanSaldoKurang(jumlahTeks: string, sumber: AkunKas | undefined): string | null {
  const jumlah = Number(jumlahTeks.trim());
  if (!sumber || !Number.isFinite(jumlah)) return null;
  return jumlah > sumber.saldo ? "Jumlah melebihi saldo akun sumber." : null;
}

/** Akun tujuan yang ditawarkan: akun aktif selain akun sumber. */
export function pilihanTujuan(akunAktif: AkunKas[], kasSumberID: string): AkunKas[] {
  return akunAktif.filter((akun) => akun.id !== kasSumberID);
}

export type FilterTransfer = { akunKasID: string; status: "" | StatusTransfer };

export const FILTER_AWAL_TRANSFER: FilterTransfer = { akunKasID: "", status: "" };

/** Query GET /jurnaltransfer: hanya filter yang diisi (akunKasID dan status). */
export function filterServerTransfer(filter: FilterTransfer): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.akunKasID) params.akunKasID = filter.akunKasID;
  if (filter.status) params.status = filter.status;
  return params;
}

export const LABEL_STATUS_TRANSFER: Record<StatusTransfer, string> = {
  AKTIF: "Aktif",
  VOID: "Dibatalkan",
};

/** Nama akun dari salinan di respons; akun tanpa nama tampil sebagai tanda hubung. */
export function namaAkunTransfer(akun: AkunTransfer | null): string {
  return akun?.namaAkun || "-";
}