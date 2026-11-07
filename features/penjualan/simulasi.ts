/**
 * Simulasi tagihan di layar buat penjualan: diskon item, diskon global, lalu
 * pajak transaksi, dengan pembulatan yang sama seperti sebelumnya. Hanya
 * perkiraan tampilan; nilai sah dihitung backend saat penjualan dibuat.
 * Dipindah apa adanya dari halaman-buat-penjualan.tsx agar dapat diuji unit.
 */

import type { Diskon } from "@/types/diskon";
import type { Pajak } from "@/types/pajak";
import type { Produk } from "@/types/produk";

export interface ItemState {
  produkID: string;
  jumlah: number;
  jumlahStr: string;
  diskonItemIDs: string[]; // State array ID Diskon Item
}

export const emptyItem = (): ItemState => ({
  produkID: "",
  jumlah: 1,
  jumlahStr: "1",
  diskonItemIDs: [],
});

export interface MasukanSimulasi {
  items: readonly ItemState[];
  produkList: readonly Produk[];
  activeDiskonItem: readonly Diskon[];
  activeDiskonGlobal: readonly Diskon[];
  diskonGlobalIDs: readonly string[];
  activePajakGlobal: readonly Pajak[];
}

export function hitungSimulasi({
  items,
  produkList,
  activeDiskonItem,
  activeDiskonGlobal,
  diskonGlobalIDs,
  activePajakGlobal,
}: MasukanSimulasi) {
  let grandTotalItem = 0;

  // 1. Hitung Item & Diskon Item
  const itemsCalc = items.map((item) => {
    const produk = produkList.find(
      (p) => p.id === item.produkID,
    );
    const subTotal = (item.jumlah || 1) * (produk?.hargaJual || 0);
    let running = subTotal;
    let totalDiskonItem = 0;

    const selectedDiskon = activeDiskonItem.filter((d) =>
      item.diskonItemIDs.includes(d.id),
    );
    for (const d of selectedDiskon) {
      let potong =
        d.tipe === "persen"
          ? Math.ceil((running * d.nilai) / 100)
          : d.nilai || 0;
      if (potong > running) potong = running;
      totalDiskonItem += potong;
      running -= potong;
    }

    grandTotalItem += running;
    return { subTotal, totalDiskonItem, totalHarga: running };
  });

  // 2. Hitung Diskon Global
  let runningGlobal = grandTotalItem;
  let totalDiskonGlobal = 0;

  const selectedDiskonGlobal = activeDiskonGlobal.filter((d) =>
    diskonGlobalIDs.includes(d.id),
  );

  for (const d of selectedDiskonGlobal) {
    let potong =
      d.tipe === "persen"
        ? Math.ceil((runningGlobal * d.nilai) / 100)
        : d.nilai || 0;
    if (potong > runningGlobal) potong = runningGlobal;
    totalDiskonGlobal += potong;
    runningGlobal -= potong;
  }

  // 3. Hitung Pajak Transaksi Global
  const dasarSetelahDiskon = runningGlobal;
  let runningTotalPajak = dasarSetelahDiskon;
  let totalPajak = 0;
  const rincianPajak = [];

  for (const p of activePajakGlobal) {
    let nilaiPajak = 0;
    if (p.modelPerhitungan === 1) {
      nilaiPajak =
        (runningTotalPajak / (1 + p.tarifPajak / 100)) * (p.tarifPajak / 100);
    } else if (p.modelPerhitungan === 2) {
      nilaiPajak = dasarSetelahDiskon * (p.tarifPajak / 100);
      runningTotalPajak += nilaiPajak;
    } else if (p.modelPerhitungan === 3) {
      nilaiPajak = runningTotalPajak * (p.tarifPajak / 100);
      runningTotalPajak += nilaiPajak;
    }

    totalPajak += Math.round(nilaiPajak);
    rincianPajak.push({
      namaPajak: p.namaPajak,
      nominal: Math.round(nilaiPajak),
      tipe: p.modelPerhitungan === 1 ? "Inc" : "Exc",
    });
  }

  return {
    itemsCalc,
    grandTotalItem,
    totalDiskonGlobal,
    rincianPajak,
    totalPajak,
    grandTotal: Math.round(runningTotalPajak),
  };
}

export type HasilSimulasi = ReturnType<typeof hitungSimulasi>;
