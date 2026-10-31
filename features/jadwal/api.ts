/**
 * Pemanggilan API jadwal shift. Daftar karyawan per ruang memakai
 * useDaftarPengguna dari features/pengguna (keputusan rancangan butir 12).
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts, dan kegagalan
 * dilempar sebagai ApiError. POST /jadwalshift dan bulk menjawab sukses
 * bila sebagian jadwal ditolak; penolakannya ada di hasil (keputusan J2a).
 * Penolakan seluruhnya dijawab 409 (B147) dan dikembalikan sebagai hasil
 * yang sama, agar halaman tetap satu jalur.
 */
import type {
  EntriBulkJadwal,
  FilterDaftarJadwal,
  HasilJadwal,
  JadwalItem,
  PayloadJadwalManual,
  PayloadUbahJadwal,
} from "./tipe";
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { hasilDariPenolakanSeluruh } from "./hasil";

function hasilAtauLempar(err: unknown): HasilJadwal {
  const hasil = hasilDariPenolakanSeluruh(err);
  if (hasil) return hasil;
  throw err;
}

export const jadwalApi = {
  /** locationID (B184): jadwal yang shift-nya di lokasi itu, ditambah libur karyawan yang berjadwal kerja di sana. */
  daftar: (filter: FilterDaftarJadwal) =>
    apiData.get<JadwalItem[]>(`${EP.jadwalShift.list}?${new URLSearchParams(filter)}`),
  buat: (payload: PayloadJadwalManual) =>
    apiData.post<HasilJadwal>(EP.jadwalShift.list, payload).catch(hasilAtauLempar),
  perbarui: (id: string, payload: PayloadUbahJadwal) =>
    apiData.put<JadwalItem>(EP.jadwalShift.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.jadwalShift.detail(id)),
  bulk: (entri: EntriBulkJadwal[]) =>
    apiData.post<HasilJadwal>(EP.jadwalShift.bulk, entri).catch(hasilAtauLempar),
};