/**
 * Pemanggilan API inventaris dan lokasi.
 *
 * Dipakai lintas halaman inventaris (bahan baku, stok, jurnal, gudang),
 * sehingga ditempatkan terpisah dari features/bahan-baku.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Inventory } from "@/types/inventory";
import type { Lokasi } from "@/types/location";

export interface FilterInventory {
  locationID: string;
  search?: string;
}

export const inventoryApi = {
  daftar: (filter: FilterInventory) =>
    apiData.get<Inventory[]>(EP.inventory.list, {
      locationID: filter.locationID,
      ...(filter.search ? { search: filter.search } : {}),
    }),
};

export const lokasiApi = {
  daftar: () => apiData.get<Lokasi[]>(EP.location.list),
  aktif: () => apiData.get<Lokasi>(EP.location.current),
};