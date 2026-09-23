"use client";

import HalamanDaftarStockAdjustment from "@/features/stock-adjustment/halaman-daftar-stock-adjustment";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";

// Ruang gudang menampilkan adjustment seluruh lokasi bertipe Gudang milik
// tenant, tanpa cakupan per gudang (keputusan produk, Model bisnis MVP).
const LINGKUP_GUDANG: LingkupLokasi = { tipeLokasi: "Gudang" };

export default function StockAdjustmentGudangPage() {
  return <HalamanDaftarStockAdjustment ruang="gudang" lingkup={LINGKUP_GUDANG} />;
}