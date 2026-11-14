import { describe, expect, it } from "vitest";
import { gudangMenus, hrefMenuAktif, outletMenus } from "@/components/sidebar-menu";

/**
 * Menu tunggal sempat hanya menyala bila pathname sama persis, sehingga
 * halaman turunannya (Catat Pembelian, Akun Toko, Buat Reservasi) tidak
 * menyalakan menu apa pun (modul/keuangan.md, utang menu tunggal).
 */
const semuaHref = (menus: typeof outletMenus) =>
  menus.flatMap((g) => g.items.flatMap((i) => [i.href, ...(i.subItems?.map((s) => s.href) ?? [])]));

const OUTLET = semuaHref(outletMenus);
const GUDANG = semuaHref(gudangMenus);

describe("hrefMenuAktif", () => {
  it("menu tunggal menyala di halaman turunannya", () => {
    expect(hrefMenuAktif("/dashboard/outlet/inventaris/pembelianStok/catatPembelian", OUTLET)).toBe(
      "/dashboard/outlet/inventaris/pembelianStok",
    );
    expect(hrefMenuAktif("/dashboard/outlet/pengaturan/akun", OUTLET)).toBe("/dashboard/outlet/pengaturan");
    expect(hrefMenuAktif("/dashboard/outlet/reservasi/buatReservasi", OUTLET)).toBe("/dashboard/outlet/reservasi");
    expect(hrefMenuAktif("/dashboard/gudang/pembelianStok/abc123", GUDANG)).toBe("/dashboard/gudang/pembelianStok");
  });

  it("sub-menu tetap menyala di halaman turunannya, dan yang terdekat menang", () => {
    expect(hrefMenuAktif("/dashboard/outlet/penjualan/abc/pembayaran", OUTLET)).toBe("/dashboard/outlet/penjualan");
    expect(hrefMenuAktif("/dashboard/outlet/keuangan/akunkas/pindahDana", OUTLET)).toBe(
      "/dashboard/outlet/keuangan/akunkas",
    );
  });

  it("dashboard ruang dan induk Keuangan hanya menyala bila sama persis", () => {
    expect(hrefMenuAktif("/dashboard/outlet", OUTLET)).toBe("/dashboard/outlet");
    expect(hrefMenuAktif("/dashboard/outlet/profil", OUTLET)).toBeNull();
    expect(hrefMenuAktif("/dashboard/outlet/keuangan/lainnya", OUTLET)).toBeNull();
    expect(hrefMenuAktif("/dashboard/gudang/profil", GUDANG)).toBeNull();
  });

  it("awalan nama yang mirip tidak dianggap turunan", () => {
    expect(hrefMenuAktif("/dashboard/outlet/pola-roster-lain", OUTLET)).toBeNull();
  });
});
