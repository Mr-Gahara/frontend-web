import type { RuangShift } from "@/features/shift/ruang";

/** Ruang kerja jadwal: outlet dan gudang punya karyawan dan jadwal masing-masing. */
export type RuangJadwal = RuangShift;

/** Item GET /jadwalshift, sesuai mappers/jadwalShiftMapper.js backend 00b9957. */
export interface JadwalItem {
  id: string;
  tanggalKerja: string; // YYYY-MM-DD
  isLibur: boolean;
  catatan: string | null;
  karyawan: { id: string; namaLengkap?: string; role?: string } | null;
  shift: {
    id: string;
    namaShift: string;
    jamMasuk: string;
    jamPulang: string;
    isLintasHari: boolean;
    status: "Aktif" | "Non-Aktif";
  } | null;
}

/** Karyawan satu ruang dari GET /pengguna?workspace=. */
export interface KaryawanRuang {
  id: string;
  nama: string;
  role: string;
}

/** Satu jadwal yang ditolak backend; reason selalu ada (services/jadwalShiftService.js). */
export type DitolakJadwal = { reason?: string; penggunaID?: string; tanggalKerja?: string };

/**
 * Hasil POST /jadwalshift (201) dan POST /jadwalshift/bulk (200), juga saat
 * seluruh jadwal ditolak (kontrak/temuan.md butir 66, keputusan J2a).
 */
export interface HasilJadwal {
  message: string;
  berhasilDiproses: number;
  ditolak: number;
  detailDitolak: DitolakJadwal[];
}

/** Payload POST /jadwalshift; ejaannya berbeda dari field model (kontrak/payload.md). */
export interface PayloadJadwalManual {
  penggunaId: string;
  tanggal: string; // YYYY-MM-DD
  isLibur: boolean;
  shiftIds: string[];
  catatan: string;
}

/** Payload PUT /jadwalshift/:id; pengguna dan tanggal tidak dapat diubah. */
export interface PayloadUbahJadwal {
  isLibur: boolean;
  shiftID: string | null;
  catatan: string;
}

/** Satu entri POST /jadwalshift/bulk; shiftID hanya untuk hari kerja. */
export interface EntriBulkJadwal {
  penggunaID: string;
  tanggalKerja: string;
  isLibur: boolean;
  shiftID?: string;
}