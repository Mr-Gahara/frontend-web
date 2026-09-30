export interface LaporanLabaRugiData {
  tanggal: string;
  totalPenjualanKotor: number;
  /** Bagian penjualan kotor dari sewa aset, sejak backend 465b438. */
  totalPenjualanSewa: number;
  totalDiskon: number;
  /** Pajak item dan transaksi; tidak termasuk omzet sejak backend 465b438. */
  totalPajak: number;
  totalOmzet: number;
  totalHPP: number;
  totalLabaKotor: number;
  totalBebanOperasional: number;
  totalLabaBersih: number;
}