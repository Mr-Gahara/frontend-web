export type TipeItemInventory = "BAHAN_BAKU" | "BARANG_INVENTORY";

export interface InventoryItemDetail {
  tipeItem: TipeItemInventory;
  id: string;
  nama: string | null;
  satuan: string | null;
  kategori?: string | null;
}

export interface LokasiInventory {
  id: string;
  nama: string | null;
  tipe: string | null;
}

/** Satu bagian rincian stok terbaca, misalnya { satuan: "kaleng", jumlah: 9 }. */
export interface RincianStok {
  satuan: string;
  jumlah: number;
}

export interface Inventory {
  id: string;
  tenantID: string;
  item: InventoryItemDetail | null;
  lokasi: LokasiInventory | null;
  stok: number;
  /**
   * Rincian stok dari kemasan terbesar ke satuan dasar (backend P87, B362),
   * misalnya [{ pak, 1 }, { kaleng, 9 }, { ml, 25 }]; tanpa kemasan satu baris
   * satuan dasar. stok tetap angka dalam satuan dasar.
   */
  stokTerbaca?: RincianStok[];
  stokMinimum: number;
  isStokKritis: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMinStockPayload {
  stokMinimum: number;
}

export interface QuickOpnamePayload {
  fisikAktual: number;
  catatan?: string;
}

export interface TambahInventoryPayload {
  bahanBakuID: string;
  locationID: string;
  stok: number;
  stokMinimum: number;
}