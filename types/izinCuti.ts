/**
 * Izin dan cuti staf dari GET /izincuti (mappers/izinCutiMapper.js backend
 * 2dd57aa). Daftar dikirim untuk seluruh tenant tanpa filter tanggal.
 */
export type TipeIzinCuti = "sakit" | "izin" | "cuti tahunan";

export type StatusIzinCuti = "diajukan" | "disetujui" | "ditolak";

export interface IzinCuti {
  id: string;
  tenantID: string | null;
  pengguna: { id: string; nama: string | null; email: string | null } | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  tipe: TipeIzinCuti;
  status: StatusIzinCuti;
  keterangan: string;
  dicatatOleh: { id: string; nama: string | null } | null;
  catatan: string | null;
  createdAt: string;
  updatedAt: string;
}