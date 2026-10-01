import type { PembatalanPembayaranRequest, PembayaranRequest } from "@/types/pembayaran";
import type { MetodePembayaran } from "@/types/metodePembayaran";

/** Nominal dari isian berformat rupiah; null bila tidak ada angka. */
export function nominalDariTeks(teks: string): number | null {
  const n = parseInt(teks.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Keterangan akun kas tujuan untuk metode terpilih. Sejak backend 465b438
 * pembayaran selalu masuk ke akun kas milik metodenya, sehingga form hanya
 * menampilkannya.
 */
export function teksAkunTujuan(metode: Pick<MetodePembayaran, "akunKas"> | undefined): string {
  if (!metode) return "Pilih metode pembayaran lebih dulu.";
  const akun = metode.akunKas;
  if (!akun?.namaAkun) return "-";
  return akun.nomorAkun ? `${akun.namaAkun} (${akun.nomorAkun})` : akun.namaAkun;
}

/**
 * Payload PUT /pembayaran/:id untuk membatalkan pembayaran. Alasan opsional
 * (keputusan PB5a) dikirim sebagai alasanVoid sejak backend yoga 8fad4c0,
 * sehingga catatan asli pembayaran tetap terbaca di riwayat; backend juga
 * menyalinnya ke keterangan mutasi kas.
 */
export function susunPayloadBatalPembayaran(alasan: string): PembatalanPembayaranRequest {
  const alasanVoid = alasan.trim();
  return alasanVoid ? { status: "VOID", alasanVoid } : { status: "VOID" };
}

export interface IsianPembayaran {
  penjualanID: string;
  metodePembayaranID: string;
  jumlahBayarStr: string;
  catatan: string;
}

/**
 * Pesan validasi form pembayaran, atau null bila sah. Urutan dan teks pesan
 * sama dengan halaman lama, karena spec pembayaran memeriksanya. sisaTagihan
 * null berarti penjualan belum termuat, sehingga batas atas tidak diperiksa.
 */
export function validasiPembayaran(
  isian: Pick<IsianPembayaran, "metodePembayaranID" | "jumlahBayarStr">,
  sisaTagihan: number | null,
  formatRupiah: (angka: number) => string,
): string | null {
  if (!isian.metodePembayaranID) return "Silakan pilih Metode Pembayaran.";
  const nominal = nominalDariTeks(isian.jumlahBayarStr);
  if (nominal === null || nominal <= 0) return "Jumlah pembayaran tidak valid.";
  if (sisaTagihan !== null && nominal > sisaTagihan) {
    return `Jumlah bayar tidak boleh melebihi sisa tagihan (${formatRupiah(sisaTagihan)}).`;
  }
  return null;
}

/**
 * Payload POST /pembayaran. status dan akunKasID tidak dikirim: sejak backend
 * 465b438 keduanya diatur server (akun kas diambil dari metode) dan
 * mengirimnya ditolak 400. tanggalBayar wajib untuk PAID dan tidak boleh
 * mendahului tanggal transaksi.
 */
export function susunPayloadPembayaran(isian: IsianPembayaran, sekarang: Date): PembayaranRequest {
  const catatan = isian.catatan.trim();
  return {
    penjualanID: isian.penjualanID,
    metodePembayaranID: isian.metodePembayaranID,
    jumlahBayar: nominalDariTeks(isian.jumlahBayarStr) ?? 0,
    tanggalBayar: sekarang.toISOString(),
    ...(catatan ? { catatan } : {}),
  };
}