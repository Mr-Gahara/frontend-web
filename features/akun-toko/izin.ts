/**
 * Siapa yang boleh mengelola Akun Toko (OA8a). Endpoint-nya berizin
 * update-akun, tetapi backend juga menolak selain Owner (level role 100,
 * isOwnerRole), sehingga keduanya disyaratkan. Level dibaca lewat
 * useLevelPenggunaAktif, pengecualian nama role yang tercatat di keputusan
 * rancangan butir 2.
 */
export const IZIN_UBAH_AKUN = "update-akun";
export const LEVEL_OWNER = 100;

export function bolehKelolaAkunToko(izin: readonly string[], level: number): boolean {
  return level >= LEVEL_OWNER && izin.includes(IZIN_UBAH_AKUN);
}
