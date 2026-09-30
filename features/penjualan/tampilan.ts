import type { StatusPenjualan } from "@/types/penjualan";

/**
 * Tampilan status penjualan sejak backend 465b438. FINAL diganti UNPAID,
 * PARTIAL, dan PAID yang dihitung dari uang yang masuk dan selalu sama
 * dengan statusBayar, sehingga daftar dan detail cukup menampilkan satu
 * status (keputusan penyesuaian 465b438).
 */
export const TAMPILAN_STATUS_PENJUALAN: Record<StatusPenjualan, { label: string; kelas: string }> = {
  DRAFT: { label: "Draft", kelas: "bg-[#FFFAF3] text-[#0A2947] border border-[#0A2947]/20" },
  UNPAID: { label: "Belum Bayar", kelas: "bg-[#D4A373] text-[#0A2947] border-none" },
  PARTIAL: { label: "Sebagian", kelas: "bg-[#0A2947]/10 text-[#0A2947] border-none" },
  PAID: { label: "Lunas", kelas: "bg-[#718355] text-[#FFFAF3] border-none" },
  VOID: { label: "Batal", kelas: "bg-[#0A2947]/10 text-[#0A2947]/60 border-none" },
};

/** Urutan pilihan filter status di daftar penjualan. */
export const URUTAN_STATUS_PENJUALAN: readonly StatusPenjualan[] = ["DRAFT", "UNPAID", "PARTIAL", "PAID", "VOID"];

/**
 * Keterangan dialog void. Void hanya ditawarkan untuk penjualan tanpa
 * pembayaran (aksiPenjualan), dan backend tidak mengembalikan stok yang
 * sudah dipotong saat penjualan disimpan.
 */
export const PESAN_VOID_PENJUALAN =
  "Tindakan ini membatalkan transaksi secara permanen beserta sesi booking-nya (jika ada). Stok yang sudah dipotong saat penjualan disimpan tidak dikembalikan.";

/**
 * Keterangan dialog batalkan pembayaran, mengikuti aturan VOID pembayaran di
 * backend 465b438.
 */
export const PESAN_BATAL_PEMBAYARAN =
  "Saldo akun kas tujuan dikurangi sebesar jumlah ini dan tagihan penjualan dibuka kembali. Pembayaran tetap tercatat di riwayat dengan status Batal, dan uang dikembalikan ke pelanggan secara manual. Pembatalan ditolak bila saldo akun kas sudah tidak cukup.";