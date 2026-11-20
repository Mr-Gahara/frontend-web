import { labelPilPeriode, type PilFilter } from "@/lib/filter";
import { keTanggalLokal } from "@/lib/waktu";
import type { AkunKas } from "@/types/akunKas";
import type {
  AkunTransfer,
  PayloadBatalTransfer,
  PayloadBuatTransfer,
  StatusTransfer,
} from "@/types/jurnalTransfer";
import type { IsianPindahDana } from "./schema";

export const URL_PINDAH_DANA = "/dashboard/outlet/keuangan/akunkas/pindahDana";

/** Parameter alamat Pindah Dana yang membuka rincian satu transfer. */
export const PARAM_TRANSFER = "transfer";

/** Alamat Pindah Dana yang langsung membuka rincian transfer itu. */
export const urlRincianTransfer = (id: string) =>
  `${URL_PINDAH_DANA}?${PARAM_TRANSFER}=${encodeURIComponent(id)}`;

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

export type FilterTransfer = {
  akunKasID: string;
  status: "" | StatusTransfer;
  /** Periode tanggal transfer; kosong berarti tanpa batas (keputusan NZ3a). */
  dari?: Date;
  sampai?: Date;
};

export const FILTER_AWAL_TRANSFER: FilterTransfer = { akunKasID: "", status: "" };

/**
 * Query GET /jurnaltransfer: hanya filter yang diisi. Periode dikirim sebagai
 * YYYY-MM-DD, yang dibaca backend sebagai hari WIB atas tanggal transfer
 * (nizar c29310c, kontrak/temuan.md butir 129). Backend menolak query di luar
 * status, akunKasID, dari, sampai, page, dan limit dengan 400.
 */
export function filterServerTransfer(filter: FilterTransfer): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.akunKasID) params.akunKasID = filter.akunKasID;
  if (filter.status) params.status = filter.status;
  if (filter.dari) params.dari = keTanggalLokal(filter.dari);
  if (filter.sampai) params.sampai = keTanggalLokal(filter.sampai);
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
/** Jumlah filter aktif untuk lencana (FL1a); periode dihitung satu. */
export function jumlahFilterTransfer(filter: FilterTransfer): number {
  return [filter.akunKasID, filter.status].filter(Boolean).length + (filter.dari || filter.sampai ? 1 : 0);
}

/** Pil filter aktif riwayat transfer (FL4a). */
export function pilFilterTransfer(
  filter: FilterTransfer,
  daftarAkun: { id: string; namaAkun: string }[],
  hariIni: Date,
  terapkan: (baru: FilterTransfer) => void,
): PilFilter[] {
  const pil: PilFilter[] = [];
  if (filter.akunKasID) {
    const nama = daftarAkun.find((a) => a.id === filter.akunKasID)?.namaAkun ?? "terpilih";
    pil.push({ kunci: "akun", label: `Akun: ${nama}`, onHapus: () => terapkan({ ...filter, akunKasID: "" }) });
  }
  if (filter.status) {
    pil.push({ kunci: "status", label: `Status: ${LABEL_STATUS_TRANSFER[filter.status]}`, onHapus: () => terapkan({ ...filter, status: "" }) });
  }
  const periode = labelPilPeriode({ dari: filter.dari, sampai: filter.sampai }, hariIni);
  if (periode) pil.push({ kunci: "periode", label: periode, onHapus: () => terapkan({ ...filter, dari: undefined, sampai: undefined }) });
  return pil;
}
