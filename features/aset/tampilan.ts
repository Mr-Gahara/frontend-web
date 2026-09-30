/**
 * Nama tipe aset untuk daftar aset. Aset yang tipe asetnya sudah tidak ada
 * (data lama; sejak backend 465b438 tipe aset yang masih dipakai aset tidak
 * dapat dihapus) tampil "Tipe Tidak Diketahui".
 */
export function namaTipeAset(aset: { dataAset?: { namaTipeAset?: string | null } | null }): string {
  return aset.dataAset?.namaTipeAset || "Tipe Tidak Diketahui";
}