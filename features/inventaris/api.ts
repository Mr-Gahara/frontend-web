/**
 * Pemanggilan API inventaris dan lokasi.
 *
 * Dipakai lintas halaman inventaris (bahan baku, stok, jurnal, gudang),
 * sehingga ditempatkan terpisah dari features/bahan-baku.
 */

import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type {
  Inventory,
  QuickOpnamePayload,
  TambahInventoryPayload,
  UpdateMinStockPayload,
} from "@/types/inventory";
import type { BuatLokasiPayload, Lokasi, PerbaruiLokasiPayload } from "@/types/location";

/** Tanpa locationID, backend mengirim stok seluruh lokasi tenant. */
export interface FilterInventory {
  locationID?: string;
  search?: string;
}

/** Satu halaman inventory (P79): dengan page atau limit, server mengirim pagination. */
export type HalamanInventory = { data: Inventory[]; pagination: Paginasi | null };

export const inventoryApi = {
  /** params disusun paramHalamanInventory (cakupan.ts). */
  halaman: async (params: Record<string, string>): Promise<HalamanInventory> => {
    const hasil = await api.get<Inventory[]>(EP.inventory.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
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
  buat: (payload: BuatLokasiPayload) => apiData.post<Lokasi>(EP.location.list, payload),
  perbarui: (id: string, payload: PerbaruiLokasiPayload) =>
    apiData.put<Lokasi>(EP.location.detail(id), payload),
};