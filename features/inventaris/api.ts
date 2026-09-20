/**
 * Pemanggilan API inventaris dan lokasi.
 *
 * Dipakai lintas halaman inventaris (bahan baku, stok, jurnal, gudang),
 * sehingga ditempatkan terpisah dari features/bahan-baku.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type {
  Inventory,
  QuickOpnamePayload,
  TambahInventoryPayload,
  UpdateMinStockPayload,
} from "@/types/inventory";
import type { Lokasi } from "@/types/location";

/** Tanpa locationID, backend mengirim stok seluruh lokasi tenant. */
export interface FilterInventory {
  locationID?: string;
  search?: string;
}

export const inventoryApi = {
  daftar: (filter: FilterInventory) =>
    apiData.get<Inventory[]>(EP.inventory.list, {
      ...(filter.locationID ? { locationID: filter.locationID } : {}),
      ...(filter.search ? { search: filter.search } : {}),
    }),
  buat: (payload: TambahInventoryPayload) =>
    apiData.post<unknown>(EP.inventory.list, payload),
  ubahStokMinimum: (id: string, payload: UpdateMinStockPayload) =>
    apiData.patch<unknown>(EP.inventory.minimumStok(id), payload),
  opname: (id: string, payload: QuickOpnamePayload) =>
    apiData.post<unknown>(EP.inventory.opname(id), payload),
};

export const lokasiApi = {
  daftar: () => apiData.get<Lokasi[]>(EP.location.list),
  aktif: () => apiData.get<Lokasi>(EP.location.current),
};