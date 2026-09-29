/**
 * Pemanggilan API jadwal shift dan karyawan per ruang.
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
  KaryawanRuang,
  PayloadJadwalManual,
  PayloadUbahJadwal,
  RuangJadwal,
} from "./tipe";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";

type PenggunaMentah = { id: string; nama?: string; role?: string };

export const jadwalApi = {
  karyawan: async (ruang: RuangJadwal): Promise<KaryawanRuang[]> => {
    const data = await apiData.get<PenggunaMentah[]>(`${EP.pengguna.list}?workspace=${ruang}`);
    return data.map((p) => ({ id: p.id, nama: p.nama ?? "-", role: p.role ?? "-" }));
  },
  daftar: (rentang: { startDate: string; endDate: string }) =>
    apiData.get<JadwalItem[]>(`${EP.jadwalShift.list}?${new URLSearchParams(rentang)}`),
  buat: (payload: PayloadJadwalManual) => apiData.post<HasilJadwal>(EP.jadwalShift.list, payload),
  perbarui: (id: string, payload: PayloadUbahJadwal) =>
    apiData.put<JadwalItem>(EP.jadwalShift.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.jadwalShift.detail(id)),
  bulk: (entri: EntriBulkJadwal[]) => apiData.post<HasilJadwal>(EP.jadwalShift.bulk, entri),
};