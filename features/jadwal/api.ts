/**
 * Pemanggilan API jadwal shift. Daftar karyawan per ruang memakai
 * useDaftarPengguna dari features/pengguna (keputusan rancangan butir 12).
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts, dan kegagalan
 * dilempar sebagai ApiError. POST /jadwalshift dan bulk menjawab sukses
 * walau sebagian atau seluruh jadwal ditolak; penolakannya ada di hasil
 * (keputusan J2a).
 */
import type {
  EntriBulkJadwal,
  HasilJadwal,
  JadwalItem,
  PayloadJadwalManual,
  PayloadUbahJadwal,
} from "./tipe";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";

export const jadwalApi = {
  daftar: (rentang: { startDate: string; endDate: string }) =>
    apiData.get<JadwalItem[]>(`${EP.jadwalShift.list}?${new URLSearchParams(rentang)}`),
  buat: (payload: PayloadJadwalManual) => apiData.post<HasilJadwal>(EP.jadwalShift.list, payload),
  perbarui: (id: string, payload: PayloadUbahJadwal) =>
    apiData.put<JadwalItem>(EP.jadwalShift.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.jadwalShift.detail(id)),
  bulk: (entri: EntriBulkJadwal[]) => apiData.post<HasilJadwal>(EP.jadwalShift.bulk, entri),
};