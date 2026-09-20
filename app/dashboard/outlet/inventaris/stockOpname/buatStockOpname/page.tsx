"use client";

import FormBuatStockOpname from "@/features/stock-opname/form-buat-stock-opname";
import { useLokasiAktif } from "@/features/inventaris/hooks";

export default function BuatStockOpnamePage() {
  const { lokasi, isLoading } = useLokasiAktif();
  return (
    <FormBuatStockOpname
      ruang="outlet"
      sumberLokasi={{ jenis: "tetap", lokasi, memuat: isLoading }}
    />
  );
}
