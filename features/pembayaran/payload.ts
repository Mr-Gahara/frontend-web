import type { PembayaranRequest } from "@/types/pembayaran";

/** Nominal dari isian berformat rupiah; null bila tidak ada angka. */
export function nominalDariTeks(teks: string): number | null {
  const n = parseInt(teks.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

export interface IsianPembayaran {
  penjualanID: string;
  akunKasID: string;
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
  isian: Pick<IsianPembayaran, "akunKasID" | "metodePembayaranID" | "jumlahBayarStr">,
  sisaTagihan: number | null,
  formatRupiah: (angka: number) => string,
): string | null {
  if (!isian.akunKasID) return "Silakan pilih Akun Kas tujuan penerimaan pembayaran.";
  if (!isian.metodePembayaranID) return "Silakan pilih Metode Pembayaran.";
  const nominal = nominalDariTeks(isian.jumlahBayarStr);
  if (nominal === null || nominal <= 0) return "Jumlah pembayaran tidak valid.";
  if (sisaTagihan !== null && nominal > sisaTagihan) {
    return `Jumlah bayar tidak boleh melebihi sisa tagihan (${formatRupiah(sisaTagihan)}).`;
  }
  return null;
}

/**
 * Payload POST /pembayaran. status tidak dikirim (keputusan K2a): backend
 * menentukannya dari metode, dan field isAutomated yang dibacanya tidak ada di
 * model, sehingga hasilnya selalu PAID. tanggalBayar wajib untuk PAID dan tidak
 * boleh mendahului tanggal transaksi.
 */
export function susunPayloadPembayaran(isian: IsianPembayaran, sekarang: Date): PembayaranRequest {
  const catatan = isian.catatan.trim();
  return {
    penjualanID: isian.penjualanID,
    akunKasID: isian.akunKasID,
    metodePembayaranID: isian.metodePembayaranID,
    jumlahBayar: nominalDariTeks(isian.jumlahBayarStr) ?? 0,
    tanggalBayar: sekarang.toISOString(),
    ...(catatan ? { catatan } : {}),
  };
}