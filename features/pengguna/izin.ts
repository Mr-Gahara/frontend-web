import { IZIN } from "@/lib/auth/permissions";

/**
 * Aksi halaman Kelola Pengguna menurut izin endpoint-nya (keputusan
 * rancangan butir 14; pemilik proyek, 24 November 2026), mengikuti
 * routes/penggunaRoute.js backend: tambah create-pengguna, ubah
 * update-pengguna atau diri sendiri (checkPermissionOrSelf), dan hapus
 * delete-pengguna. Aturan level (pengguna setara atau lebih tinggi tidak
 * dapat diubah) tetap di halaman.
 */
export function aksiPengguna(permissions: readonly string[]) {
  return {
    buat: permissions.includes(IZIN.buatPengguna),
    ubah: permissions.includes(IZIN.ubahPengguna),
    hapus: permissions.includes(IZIN.hapusPengguna),
  };
}

/** Edit ditawarkan pada baris diri sendiri, atau bila pengguna memegang update-pengguna. */
export function tawarkanEdit(aksi: ReturnType<typeof aksiPengguna>, diriSendiri: boolean): boolean {
  return diriSendiri || aksi.ubah;
}
