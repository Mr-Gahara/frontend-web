import { formatRupiah } from "@/lib/format";
import { keTanggalLokal } from "@/lib/waktu";
import type { AkunKas, ArahMutasi, JenisMutasi, MutasiKas } from "@/types/akunKas";

/** Filter halaman mutasi. Teks kosong berarti tidak disaring. */
export interface FilterMutasi {
  akunKasID: string;
  dari: Date | undefined;
  sampai: Date | undefined;
  arah: ArahMutasi | "";
  jenis: JenisMutasi | "";
}

/** Sama dengan JENIS_MUTASI backend: arah uang tiap jenis mutasi. */
export const ARAH_JENIS: Record<JenisMutasi, ArahMutasi> = {
  SALDO_AWAL: "MASUK",
  PEMBAYARAN: "MASUK",
  VOID_PEMBAYARAN: "KELUAR",
  BEBAN: "KELUAR",
  PEMBALIK_BEBAN: "MASUK",
  TRANSFER_KELUAR: "KELUAR",
  TRANSFER_MASUK: "MASUK",
  VOID_TRANSFER_KELUAR: "MASUK",
  VOID_TRANSFER_MASUK: "KELUAR",
};

export const LABEL_JENIS: Record<JenisMutasi, string> = {
  SALDO_AWAL: "Saldo awal",
  PEMBAYARAN: "Pembayaran",
  VOID_PEMBAYARAN: "Pembatalan pembayaran",
  BEBAN: "Beban",
  PEMBALIK_BEBAN: "Pembalik beban",
  TRANSFER_KELUAR: "Transfer keluar",
  TRANSFER_MASUK: "Transfer masuk",
  VOID_TRANSFER_KELUAR: "Pembatalan transfer keluar",
  VOID_TRANSFER_MASUK: "Pembatalan transfer masuk",
};

export const LABEL_ARAH: Record<ArahMutasi, string> = {
  MASUK: "Uang masuk",
  KELUAR: "Uang keluar",
};

/** Batas limit backend 100 (utils/paginasi.js). */
export const PILIHAN_UKURAN_MUTASI = [10, 20, 50, 100] as const;
export const UKURAN_MUTASI_BAWAAN = 20;

/** Periode saat halaman dibuka: tanggal 1 bulan berjalan sampai hari ini (keputusan MK3a). */
export function filterAwalMutasi(sekarang: Date = new Date()): FilterMutasi {
  return {
    akunKasID: "",
    dari: new Date(sekarang.getFullYear(), sekarang.getMonth(), 1),
    sampai: new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()),
    arah: "",
    jenis: "",
  };
}

export function awalHari(tanggal: Date): Date {
  return new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate(), 0, 0, 0, 0);
}

export function akhirHari(tanggal: Date): Date {
  return new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate(), 23, 59, 59, 999);
}

/**
 * Batas periode sebagai ISO utuh dari awal dan akhir hari lokal. Tanggal
 * tanpa jam dibaca backend sebagai tengah malam UTC, sehingga mutasi yang
 * dicatat sebelum pukul 07.00 WIB akan terlewat.
 */
export function paramPeriodeMutasi(filter: Pick<FilterMutasi, "dari" | "sampai">): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.dari) params.dari = awalHari(filter.dari).toISOString();
  if (filter.sampai) params.sampai = akhirHari(filter.sampai).toISOString();
  return params;
}

/** Query GET /akunkas/mutasi: hanya filter yang diisi yang dikirim. */
export function filterServerMutasi(filter: FilterMutasi): Record<string, string> {
  const params = paramPeriodeMutasi(filter);
  if (filter.akunKasID) params.akunKasID = filter.akunKasID;
  if (filter.arah) params.arah = filter.arah;
  if (filter.jenis) params.jenis = filter.jenis;
  return params;
}

/** Jenis yang ditawarkan: seluruhnya, atau hanya yang searah dengan filter arah. */
export function pilihanJenis(arah: ArahMutasi | ""): JenisMutasi[] {
  const semua = Object.keys(ARAH_JENIS) as JenisMutasi[];
  return arah ? semua.filter((jenis) => ARAH_JENIS[jenis] === arah) : semua;
}

/** Mengganti arah mengosongkan jenis yang tidak searah, agar daftar tidak kosong tanpa sebab. */
export function gantiArah(filter: FilterMutasi, arah: ArahMutasi | ""): FilterMutasi {
  const jenisBertahan = !filter.jenis || !arah || ARAH_JENIS[filter.jenis] === arah;
  return { ...filter, arah, jenis: jenisBertahan ? filter.jenis : "" };
}

/** Baris mutasi hanya membawa id akun; namanya dicocokkan dari daftar akun kas. */
export function namaAkunMutasi(akunKasID: string, daftar: AkunKas[] | undefined): string {
  return daftar?.find((akun) => akun.id === akunKasID)?.namaAkun ?? "Akun tidak dikenal";
}

/** Nama akun sebuah baris: dari baris itu sendiri (backend nizar c29310c), dengan daftar akun sebagai cadangan. */
export function namaAkunBaris(mutasi: Pick<MutasiKas, "akunKasID" | "akunKas">, daftar: AkunKas[] | undefined): string {
  return mutasi.akunKas?.namaAkun || namaAkunMutasi(mutasi.akunKasID, daftar);
}

/** Nama pencatat baris mutasi, atau tanda hubung bila backend tidak mengirimnya. */
export function namaPencatat(mutasi: Pick<MutasiKas, "pengguna">): string {
  return mutasi.pengguna?.nama || "-";
}

/** Tautan ke detail penjualan untuk mutasi pembayaran dan pembatalannya; null untuk jenis lain (NZ2a). */
export function tautanPenjualanMutasi(mutasi: Pick<MutasiKas, "referensi">): { url: string; teks: string } | null {
  const id = mutasi.referensi.penjualanID;
  if (!id) return null;
  return { url: `/dashboard/outlet/penjualan/${id}`, teks: mutasi.referensi.noReferensi || "Lihat penjualan" };
}

export function teksJumlahMutasi(mutasi: Pick<MutasiKas, "arah" | "jumlah">): string {
  return `${mutasi.arah === "MASUK" ? "+" : "-"} ${formatRupiah(mutasi.jumlah)}`;
}

/** Tanggal transaksi boleh diisi mundur atau maju, sehingga dapat berbeda hari dari waktu dicatat. */
export function tanggalTransaksiBerbeda(mutasi: Pick<MutasiKas, "tanggal" | "createdAt">): boolean {
  return keTanggalLokal(new Date(mutasi.tanggal)) !== keTanggalLokal(new Date(mutasi.createdAt));
}