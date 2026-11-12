/**
 * Pemilik cache React Query: akun dan pengguna yang datanya sedang tersimpan.
 *
 * Logout hanya berpindah halaman (router.push), sehingga QueryClient dan
 * isinya bertahan. Tanpa pembersihan, akun atau pengguna berikutnya di tab
 * yang sama melihat data milik sebelumnya selama kunci query masih segar
 * (staleTime 5 menit): akun kas toko lain tampil tanpa satu pun permintaan
 * /akunkas (dilaporkan pemilik proyek 12 November 2026).
 *
 * Cache dibersihkan saat akun atau pengguna lain masuk, bukan saat logout:
 * komponen dashboard yang masih terpasang saat logout akan langsung
 * membangun ulang query yang dibuang tanpa token.
 */

export interface PemilikCache {
  akunID: string | null;
  penggunaID: string | null;
}

interface IdentitasSesi {
  akun: { id: string } | null;
  pengguna: { id: string } | null;
}

/**
 * Menentukan apakah cache harus dibersihkan untuk sesi sekarang, beserta
 * pemilik cache sesudahnya. Hanya identitas baru yang berbeda dari pemilik
 * terakhir yang membersihkan; sesi yang kosong (logout) tidak mengubah
 * pemilik, sehingga akun atau pengguna yang sama masuk lagi tetap memakai
 * cache-nya sendiri.
 */
export function periksaPemilikCache(
  pemilik: PemilikCache,
  sesi: IdentitasSesi,
): { bersihkan: boolean; pemilik: PemilikCache } {
  const akunID = sesi.akun?.id ?? null;
  const penggunaID = sesi.pengguna?.id ?? null;
  const akunLain = akunID !== null && pemilik.akunID !== null && akunID !== pemilik.akunID;
  const penggunaLain =
    penggunaID !== null && pemilik.penggunaID !== null && penggunaID !== pemilik.penggunaID;
  const bersihkan = akunLain || penggunaLain;
  return {
    bersihkan,
    pemilik: {
      akunID: akunID ?? pemilik.akunID,
      // Akun lain berarti pengguna lama bukan pemilik lagi.
      penggunaID: penggunaID ?? (akunLain ? null : pemilik.penggunaID),
    },
  };
}
