import type { NilaiAwalRole } from "./nilai-awal";
import type { NilaiFormRole } from "./schema";
import type { BuatRoleRequest, PerbaruiRoleRequest, Permission } from "@/types/role";

/**
 * Id permission untuk daftar nama wewenang. Nama tanpa padanan di daftar
 * permission dibuang, karena backend hanya menerima id yang dikenalnya.
 */
function idIzin(nama: readonly string[], semua: readonly Permission[]): string[] {
  return nama
    .map((n) => semua.find((p) => p.nama === n)?.id)
    .filter((id): id is string => typeof id === "string");
}

/** True bila kedua daftar memuat nama yang sama, tanpa melihat urutan. */
function izinSama(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((n) => b.includes(n));
}

/**
 * Payload POST /role. Wewenang tersembunyi (terlarang tetapi sudah dimiliki)
 * ikut dikirim agar tidak hilang; deskripsi kosong tidak dikirim.
 */
export function payloadBuatRole(
  nilai: NilaiFormRole,
  izinTersembunyi: readonly string[],
  semua: readonly Permission[],
): BuatRoleRequest {
  const deskripsi = nilai.deskripsi.trim();
  return {
    namaRole: nilai.namaRole.trim(),
    ...(deskripsi ? { deskripsi } : {}),
    level: Number(nilai.level),
    permissions: idIzin([...nilai.izin, ...izinTersembunyi], semua),
  };
}

/**
 * Payload PUT /role/:id: hanya field yang berbeda dari nilai awal yang
 * dimuat dari server (keputusan rancangan butir 15, RL2a). Deskripsi yang
 * dikosongkan dikirim sebagai teks kosong. Daftar wewenang dikirim utuh,
 * termasuk yang tersembunyi, hanya bila susunannya berubah.
 */
export function payloadPerbaruiRole(
  awal: NilaiAwalRole,
  nilai: NilaiFormRole,
  semua: readonly Permission[],
): PerbaruiRoleRequest {
  const payload: PerbaruiRoleRequest = {};
  const namaRole = nilai.namaRole.trim();
  const deskripsi = nilai.deskripsi.trim();
  if (namaRole !== awal.namaRole.trim()) payload.namaRole = namaRole;
  if (deskripsi !== awal.deskripsi.trim()) payload.deskripsi = deskripsi;
  if (Number(nilai.level) !== Number(awal.level)) payload.level = Number(nilai.level);
  if (!izinSama(nilai.izin, awal.izinTerpilih)) {
    payload.permissions = idIzin([...nilai.izin, ...awal.izinTersembunyi], semua);
  }
  return payload;
}

export function adaPerubahanRole(payload: PerbaruiRoleRequest): boolean {
  return Object.keys(payload).length > 0;
}