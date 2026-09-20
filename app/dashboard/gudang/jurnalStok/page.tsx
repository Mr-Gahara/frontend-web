"use client";

import HalamanJurnalStok from "@/features/jurnal-stok/halaman-jurnal-stok";
import type { LingkupJurnal } from "@/features/jurnal-stok/filter";

const LINGKUP_GUDANG: LingkupJurnal = { tipeLokasi: "Gudang" };

export default function JurnalStokGudangPage() {
  return (
    <HalamanJurnalStok
      ruang="gudang"
      lingkup={LINGKUP_GUDANG}
      deskripsi="Rekam jejak pergerakan keluar-masuk barang di Gudang Pusat. Data tidak dapat dimanipulasi."
    />
  );
}
