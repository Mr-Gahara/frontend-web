import { describe, expect, it } from "vitest";
import { outletMenus } from "@/components/sidebar-menu";
import { bolehBukaHalaman } from "@/lib/auth/permissions";

/**
 * Laman Keuangan pindah dari tab ke sub-menu Keuangan dan Laporan di sidebar
 * (pemilik proyek, 12 November 2026). Anak menu yang halamannya ditolak
 * IZIN_HALAMAN disembunyikan, seperti tab sebelumnya (kontrak/temuan.md
 * butir 163); kasus izinnya dibawa dari test tab yang dibuang.
 */
const menu = (label: string) => {
  const item = outletMenus.flatMap((g) => g.items).find((i) => i.label === label);
  if (!item) throw new Error(`menu ${label} tidak ada`);
  return item;
};

const anakTerlihat = (label: string, permissions: string[]) =>
  (menu(label).subItems ?? [])
    .filter((s) => bolehBukaHalaman(s.href, permissions))
    .map((s) => s.label);

describe("sub-menu Keuangan dan Laporan", () => {
  it("susunannya: Keuangan enam anak, Laporan dua anak", () => {
    expect(menu("Keuangan").subItems?.map((s) => s.label)).toEqual([
      "Penjualan",
      "Pengeluaran",
      "Akun Kas & Bank",
      "Mutasi Kas",
      "Belanja Stok",
      "Mesin Kasir",
    ]);
    expect(menu("Laporan").subItems?.map((s) => s.label)).toEqual(["Ringkasan Laba/Rugi", "Arus Kas"]);
  });

  it("href induk Laporan tidak sama dengan anak mana pun", () => {
    const laporan = menu("Laporan");
    expect(laporan.subItems?.some((s) => s.href === laporan.href)).toBe(false);
  });

  it("menyembunyikan anak yang halamannya ditolak IZIN_HALAMAN", () => {
    const izin = ["read-akunkas"];
    expect(anakTerlihat("Keuangan", izin)).toEqual(["Akun Kas & Bank", "Mutasi Kas"]);
    expect(anakTerlihat("Laporan", izin)).toEqual([]);
  });

  it("Belanja Stok tampil dengan izin pembelian per ruang, laporan dengan read-laporan", () => {
    const izin = ["read-akunkas", "read-location", "read-pembelian-stok-gudang", "read-laporan"];
    expect(anakTerlihat("Keuangan", izin)).toEqual(["Akun Kas & Bank", "Mutasi Kas", "Belanja Stok"]);
    expect(anakTerlihat("Laporan", izin)).toEqual(["Ringkasan Laba/Rugi", "Arus Kas"]);
  });

  it("Mesin Kasir tampil dengan read-sesi-kasir saja", () => {
    expect(anakTerlihat("Keuangan", ["read-akunkas", "read-sesi-kasir"])).toEqual([
      "Akun Kas & Bank",
      "Mutasi Kas",
      "Mesin Kasir",
    ]);
  });

  it("Mesin Kasir tidak tampil dengan kelola-perangkat-kasir tanpa read-sesi-kasir", () => {
    expect(anakTerlihat("Keuangan", ["kelola-perangkat-kasir", "read-pengguna", "read-akunkas"])).toEqual([
      "Akun Kas & Bank",
      "Mutasi Kas",
    ]);
  });

  it("tanpa izin tidak ada anak menu", () => {
    expect(anakTerlihat("Keuangan", [])).toEqual([]);
    expect(anakTerlihat("Laporan", [])).toEqual([]);
  });
});
