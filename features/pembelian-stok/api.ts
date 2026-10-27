import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type {
  PayloadBuatPembelianStok,
  PayloadUbahPembelianStok,
  PembelianStok,
  PembelianStokTersimpan,
  RingkasanPembelianStok,
} from "@/types/pembelianStok";

export type HalamanPembelianStok = { data: PembelianStok[]; pagination: Paginasi | null };

export const pembelianStokApi = {
  /** Satu halaman daftar (B103); pagination diteruskan apa adanya. */
  daftar: async (params: Record<string, string>): Promise<HalamanPembelianStok> => {
    const hasil = await api.get<PembelianStok[]>(EP.pembelianStok.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  /** Ringkasan pada filter yang sama dengan daftar (B117); page dan limit hanya memotong supplier. */
  ringkasan: (params: Record<string, string>) =>
    apiData.get<RingkasanPembelianStok>(EP.pembelianStok.list + "/ringkasan", params),
  detail: (id: string) => apiData.get<PembelianStok>(EP.pembelianStok.detail(id)),
  buat: (payload: PayloadBuatPembelianStok) =>
    apiData.post<PembelianStokTersimpan>(EP.pembelianStok.list, payload),
  perbarui: (id: string, payload: PayloadUbahPembelianStok) =>
    apiData.put<PembelianStokTersimpan>(EP.pembelianStok.detail(id), payload),
  /** Menghapus pembelian dan mengurangi kembali stoknya (B77); 409 bila stoknya sudah terpakai. */
  hapus: (id: string) => apiData.delete(EP.pembelianStok.detail(id)),
};