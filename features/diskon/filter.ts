import type { Diskon, DiskonCakupan } from "@/types/diskon";

/**
 * Diskon yang dapat ditawarkan kasir untuk satu cakupan (keputusan PD4a):
 * berstatus Aktif dan sedang berlaku menurut backend, yaitu di dalam masa,
 * jam, hari, dan kuotanya. sedangBerlaku dihitung backend saat respons
 * dibuat, sehingga dapat tertinggal selama daftar masih segar di cache;
 * backend tetap menolak diskon yang tidak berlaku saat disimpan.
 */
export function diskonAktif(daftar: Diskon[], cakupan: DiskonCakupan): Diskon[] {
  return daftar.filter(
    (d) => d.status === "Aktif" && d.sedangBerlaku && d.cakupan === cakupan,
  );
}

/**
 * Pilihan diskon setelah satu diskon diklik (keputusan R7b; aturan halaman
 * buat reservasi lama dipertahankan):
 * - diskon yang sudah terpilih dilepas;
 * - diskon yang tidak dapat digabung menggantikan seluruh pilihan;
 * - diskon yang dapat digabung ditambahkan, kecuali pilihan sekarang memuat
 *   diskon yang tidak dapat digabung, yang lalu digantikan.
 * Id yang tidak ada di daftar tersedia diabaikan.
 */
export function pilihDiskon(terpilih: string[], id: string, tersedia: Diskon[]): string[] {
  const target = tersedia.find((d) => d.id === id);
  if (!target) return terpilih;
  if (terpilih.includes(id)) return terpilih.filter((x) => x !== id);
  if (!target.bisaDigabung) return [id];
  const sekarang = tersedia.filter((d) => terpilih.includes(d.id));
  if (sekarang.some((d) => !d.bisaDigabung)) return [id];
  return [...terpilih, id];
}