import type { Pelanggan } from "@/types/pelanggan";

/** Bagian pelanggan yang dibutuhkan pemilih di buat penjualan dan buat reservasi. */
type PelangganPilihan = Pick<Pelanggan, "id" | "namaPelanggan" | "nomorHp">;

/**
 * Nama pelanggan, ditambah nomor HP dalam kurung bila ada. Sejak backend
 * nizar 8dc6211 nama boleh kembar dan pembedanya nomor HP serta email,
 * sehingga pemilih pelanggan menampilkan nomor HP di samping nama.
 */
export function labelPelanggan(
  p: Pick<PelangganPilihan, "namaPelanggan" | "nomorHp">,
): string {
  return p.nomorHp ? `${p.namaPelanggan} (${p.nomorHp})` : p.namaPelanggan;
}

/** Label pelanggan ber-id itu, atau null bila tidak ada di daftar. */
export function labelPelangganTerpilih(
  daftar: readonly PelangganPilihan[],
  id: string,
): string | null {
  const p = daftar.find((x) => x.id === id);
  return p ? labelPelanggan(p) : null;
}

/**
 * Pencarian pemilih: cocok bila kata ada di nama atau nomor HP, tanpa
 * membedakan huruf besar kecil. Kata kosong cocok dengan semua.
 */
export function cocokCariPelanggan(
  p: Pick<PelangganPilihan, "namaPelanggan" | "nomorHp">,
  kata: string,
): boolean {
  const q = kata.trim().toLowerCase();
  if (!q) return true;
  return (
    p.namaPelanggan.toLowerCase().includes(q) ||
    (p.nomorHp ?? "").toLowerCase().includes(q)
  );
}

/**
 * Nilai item pilihan: label untuk pencarian bawaan daftar, ditambah id agar
 * dua pelanggan bernama sama tidak bertabrakan.
 */
export function nilaiPilihanPelanggan(p: PelangganPilihan): string {
  return `${labelPelanggan(p)} ${p.id}`;
}