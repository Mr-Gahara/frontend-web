import { IZIN } from "@/lib/auth/permissions";

/** Izin kategori beban, sesuai routes/kategoriBebanRoute.js backend ridho 00de455. */
export function aksiKategoriBeban(permissions: readonly string[]) {
  return {
    baca: permissions.includes(IZIN.kategoriBeban),
    buat: permissions.includes(IZIN.buatKategoriBeban),
    ubah: permissions.includes(IZIN.ubahKategoriBeban),
    hapus: permissions.includes(IZIN.hapusKategoriBeban),
  };
}