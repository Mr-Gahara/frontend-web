"use client";

import { useMemo } from "react";
import FormBuatStockOpname from "@/features/stock-opname/form-buat-stock-opname";
import { useDaftarLokasi } from "@/features/inventaris/hooks";

export default function BuatStockOpnameGudangPage() {
  const { data: semuaLokasi = [], isLoading } = useDaftarLokasi();
  const pilihan = useMemo(
    () => semuaLokasi.filter((lokasi) => lokasi.tipe === "Gudang"),
    [semuaLokasi],
  );
  return (
    <FormBuatStockOpname
      ruang="gudang"
      sumberLokasi={{ jenis: "pilih", pilihan, memuat: isLoading }}
    />
  );
}
