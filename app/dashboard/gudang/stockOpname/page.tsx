"use client";

import HalamanDaftarStockOpname from "@/features/stock-opname/halaman-daftar-stock-opname";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";

const LINGKUP_GUDANG: LingkupLokasi = { tipeLokasi: "Gudang" };

export default function StockOpnameGudangPage() {
  return <HalamanDaftarStockOpname ruang="gudang" lingkup={LINGKUP_GUDANG} />;
}
