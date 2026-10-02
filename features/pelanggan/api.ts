import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type {
  BuatPelangganPayload,
  Pelanggan,
  PerbaruiPelangganPayload,
} from "@/types/pelanggan";

export const pelangganApi = {
  daftar: () => apiData.get<Pelanggan[]>(EP.pelanggan.list),
  buat: (payload: BuatPelangganPayload) => apiData.post<Pelanggan>(EP.pelanggan.list, payload),
  perbarui: (id: string, payload: PerbaruiPelangganPayload) =>
    apiData.put<Pelanggan>(EP.pelanggan.detail(id), payload),
  hapus: (id: string) => apiData.delete(EP.pelanggan.detail(id)),
};
