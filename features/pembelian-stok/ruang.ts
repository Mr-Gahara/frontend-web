import { TIPE_LOKASI_RUANG } from "@/features/stock-adjustment/ruang";
import { IZIN, bolehBukaHalaman } from "@/lib/auth/permissions";
import { bolehMenurutPlan } from "@/lib/auth/fitur-plan";
import type { KunciPlan } from "@/types/langganan";
import { aksiPembelianStok, type RuangPembelian } from "./izin";

/** Daftar pembelian stok per ruang. */
export const URL_PEMBELIAN: Record<RuangPembelian, string> = {
  outlet: "/dashboard/outlet/inventaris/pembelianStok",
  gudang: "/dashboard/gudang/pembelianStok",
};

export function urlDetailPembelian(ruang: RuangPembelian, id: string): string {
  return `${URL_PEMBELIAN[ruang]}/${id}`;
}

export function urlCatatPembelian(ruang: RuangPembelian): string {
  return `${URL_PEMBELIAN[ruang]}/catatPembelian`;
}

/**
 * Tipe lokasi penerima yang pembeliannya ditampilkan di tiap ruang. Stok
 * outlet dan gudang tidak dicampur di tampilan mana pun (Model bisnis MVP),
 * sama dengan stock adjustment dan stock opname.
 */
export const TIPE_LOKASI_PEMBELIAN: Record<RuangPembelian, string> = TIPE_LOKASI_RUANG;
/**
 * Ruang tempat pengguna dapat mencatat pembelian dari tombol "Catat
 * pembelian" di Belanja Stok (pemilik proyek, 12 November 2026): izin buat di
 * ruang itu, rute catatnya lolos plan dan IZIN_HALAMAN, dan untuk gudang
 * juga syarat layout ruang gudang (read-dashboard-gudang dan lokasi bertipe
 * Gudang, features/inventaris/akses-gudang.ts). Basic dan Advanced hanya
 * outlet, karena ruang gudang milik plan Pro.
 */
export function ruangCatatBelanja(m: {
  permissions: readonly string[];
  plan: KunciPlan;
  adaGudang: boolean;
}): RuangPembelian[] {
  const boleh = (ruang: RuangPembelian) => {
    const url = urlCatatPembelian(ruang);
    return (
      aksiPembelianStok(m.permissions, ruang).buat &&
      bolehMenurutPlan(url, m.plan) &&
      bolehBukaHalaman(url, [...m.permissions])
    );
  };
  const hasil: RuangPembelian[] = [];
  if (boleh("outlet")) hasil.push("outlet");
  if (boleh("gudang") && m.adaGudang && m.permissions.includes(IZIN.dashboardGudang)) hasil.push("gudang");
  return hasil;
}
