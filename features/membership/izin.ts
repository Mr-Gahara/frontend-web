import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin modul membership, sesuai routes/membershipRoute.js dan
 * routes/paketMembershipRoute.js backend 4a19be8 (keputusan rancangan butir
 * 9 dan 14). Mendaftarkan member juga membaca pelanggan, paket, dan
 * penjualan pelanggan itu, sehingga tombolnya menuntut ketiga izin baca.
 */
export function aksiMembership(permissions: readonly string[]) {
  const punya = (nama: string) => permissions.includes(nama);
  const bacaPaket = punya(IZIN.paketMembership);
  const bacaPilihan = bacaPaket && punya(IZIN.pelanggan) && punya(IZIN.penjualan);
  return {
    bacaMember: punya(IZIN.membership),
    bacaPaket,
    daftarkan: punya(IZIN.buatMembership) && bacaPilihan,
    ubahMember: punya(IZIN.ubahMembership) && bacaPaket,
    hapusMember: punya(IZIN.hapusMembership),
    buatPaket: punya(IZIN.buatPaketMembership),
    ubahPaket: punya(IZIN.ubahPaketMembership),
    hapusPaket: punya(IZIN.hapusPaketMembership),
  };
}
