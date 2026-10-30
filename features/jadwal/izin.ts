import { bolehBukaHalaman, IZIN } from "@/lib/auth/permissions";

/**
 * Izin kalender jadwal, mengikuti checkPermission di
 * routes/jadwalShiftRoute.js backend ridho 02b5a60 (B140; keputusan
 * rancangan butir 9 dan 14). Buat manual dan generate memakai
 * create-jadwal-shift; generate juga membaca pola roster, sehingga
 * tombolnya mengikuti gerbang halaman generate.
 */
export function aksiJadwal(permissions: string[], urlGenerate: string) {
  return {
    buat: permissions.includes(IZIN.buatJadwalShift),
    ubah: permissions.includes(IZIN.ubahJadwalShift),
    hapus: permissions.includes(IZIN.hapusJadwalShift),
    generate: bolehBukaHalaman(urlGenerate, permissions),
  };
}
