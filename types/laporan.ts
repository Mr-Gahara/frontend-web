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

/**
 * Angka arus kas per baris dan di ringkasan (GET /laporan/arus-kas, B291).
 * Kotor dan pembatalannya terpisah; transfer hanya terisi bila satu akun kas
 * dipilih. arusKasBersih = masuk dikurangi keluar yang dihitung.
 */
export interface AngkaArusKas {
  penjualanMasuk: number;
  penjualanVoid: number;
  bebanKeluar: number;
  bebanPembalik: number;
  pembelianKeluar: number;
  pembelianPembalik: number;
  selisihKasMasuk: number;
  selisihKasKeluar: number;
  transferMasuk: number;
  transferMasukVoid: number;
  transferKeluar: number;
  transferKeluarVoid: number;
  saldoAwalAkun: number;
  arusKasBersih: number;
}

/** Satu baris: tanggal "YYYY-MM-DD", Senin minggunya, atau "YYYY-MM" menurut kelompok. */
export interface BarisArusKas extends AngkaArusKas {
  tanggal: string;
}

export interface RingkasanArusKas extends AngkaArusKas {
  startDate: string;
  endDate: string;
  akunKasID: string | null;
  saldoAwalPeriode: number;
  saldoAkhirPeriode: number;
}

export interface LaporanArusKas {
  baris: BarisArusKas[];
  ringkasan: RingkasanArusKas;
}
