import { IZIN } from "@/lib/auth/permissions";
import type { Penjualan, PembayaranPenjualan } from "@/types/penjualan";

/**
 * Cakupan outlet di daftar penjualan hanya berlaku bagi pemegang
 * read-location (keputusan K11b, 24 September 2026). Tanpa izin itu lokasi
 * tidak dapat dibaca, sehingga pengguna melihat penjualan seluruh tenant;
 * pada MVP satu outlet hasilnya sama dengan outlet tenant. Utang yang wajib
 * ditutup sebelum multi-outlet, dan dilaporkan ke backend: pengguna tenant
 * butuh cara mengetahui outletnya tanpa read-location.
 */
export function bolehCakupanPenjualan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.location);
}

/** Izin aksi penjualan dan pembayarannya, sesuai route backend 465b438 (keputusan rancangan butir 14). */
export const IZIN_PENJUALAN = {
  ubah: "update-penjualan",
  hapus: "delete-penjualan",
  bayar: "create-pembayaran",
  batalBayar: "update-pembayaran",
} as const;

export interface AksiPenjualan {
  finalisasi: boolean;
  bayar: boolean;
  void: boolean;
  hapus: boolean;
}

/**
 * Aksi yang ditawarkan per status dan izin, sejalan dengan aturan backend
 * 465b438: DRAFT belum dapat dibayar, pembayaran hanya untuk UNPAID dan
 * PARTIAL, void untuk DRAFT dan UNPAID tanpa pembayaran (penjualan yang
 * sudah dibayar harus dibatalkan pembayarannya dulu), dan hapus hanya
 * DRAFT. Finalisasi dari web hanya untuk invoice, sama dengan halaman lama.
 */
export function aksiPenjualan(
  p: Pick<Penjualan, "statusPenjualan" | "sisaTagihan" | "totalDibayar" | "jenisTransaksi">,
  permissions: readonly string[],
): AksiPenjualan {
  const boleh = (izin: string) => permissions.includes(izin);
  const draft = p.statusPenjualan === "DRAFT";
  return {
    finalisasi: draft && p.jenisTransaksi === "INVOICE" && boleh(IZIN_PENJUALAN.ubah),
    bayar:
      (p.statusPenjualan === "UNPAID" || p.statusPenjualan === "PARTIAL") &&
      p.sisaTagihan > 0 &&
      boleh(IZIN_PENJUALAN.bayar),
    void: (draft || (p.statusPenjualan === "UNPAID" && p.totalDibayar === 0)) && boleh(IZIN_PENJUALAN.ubah),
    hapus: draft && boleh(IZIN_PENJUALAN.hapus),
  };
}

/**
 * Pembayaran yang dapat dibatalkan dari riwayat detail: hanya yang PAID, bagi
 * pemegang update-pembayaran (backend 465b438 menerima status VOID lewat
 * PUT /pembayaran/:id). Pembayaran VOID tetap tampil sebagai jejak.
 */
export function bolehBatalkanPembayaran(
  pembayaran: Pick<PembayaranPenjualan, "status">,
  permissions: readonly string[],
): boolean {
  return pembayaran.status === "PAID" && permissions.includes(IZIN_PENJUALAN.batalBayar);
}