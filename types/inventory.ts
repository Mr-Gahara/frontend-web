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

export interface Inventory {
  id: string;
  tenantID: string;
  item: InventoryItemDetail | null;
  lokasi: LokasiInventory | null;
  stok: number;
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