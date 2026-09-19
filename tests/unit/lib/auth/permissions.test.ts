import { describe, expect, it } from "vitest";
import { IZIN, IZIN_HALAMAN, bolehBukaGrup, bolehBukaHalaman } from "@/lib/auth/permissions";

/** Owner memegang seluruh permission yang terdaftar di seed backend. */
const IZIN_OWNER = Object.values(IZIN);

describe("bolehBukaHalaman", () => {
  it("mengizinkan halaman tanpa kebutuhan izin", () => {
    expect(bolehBukaHalaman("/dashboard/outlet", [])).toBe(true);
  });

  it("mengizinkan href yang tidak terdaftar di peta", () => {
    // Halaman detail dan form tidak dipetakan; pembatasannya ada di backend.
    expect(bolehBukaHalaman("/dashboard/outlet/penjualan/123", [])).toBe(true);
  });

  it("menolak bila izin tunggal tidak dimiliki", () => {
    expect(bolehBukaHalaman("/dashboard/outlet/inventaris/produk", [])).toBe(false);
    expect(bolehBukaHalaman("/dashboard/outlet/inventaris/produk", [IZIN.produk])).toBe(true);
  });

  it("mensyaratkan seluruh izin untuk halaman dengan kebutuhan ganda", () => {
    // Halaman pengguna memanggil /pengguna dan /role saat dimuat.
    const href = "/dashboard/outlet/pengguna";
    expect(bolehBukaHalaman(href, [IZIN.pengguna])).toBe(false);
    expect(bolehBukaHalaman(href, [IZIN.pengguna, IZIN.role])).toBe(true);
  });

  it("memakai izin transfer stok untuk menu pengiriman stok", () => {
    // Endpoint halaman ini adalah /transferstok, bukan pengiriman stok.
    const href = "/dashboard/gudang/pengirimanStok";
    expect(bolehBukaHalaman(href, ["read-pengiriman-stok"])).toBe(false);
    expect(bolehBukaHalaman(href, [IZIN.transferStok])).toBe(true);
  });

  it("mengizinkan seluruh halaman terpetakan bagi pemilik semua izin", () => {
    for (const href of Object.keys(IZIN_HALAMAN)) {
      expect(bolehBukaHalaman(href, IZIN_OWNER), href).toBe(true);
    }
  });
});

describe("bolehBukaGrup", () => {
  const anakInventaris = [
    "/dashboard/outlet/inventaris/produk",
    "/dashboard/outlet/inventaris/kategori",
    "/dashboard/outlet/inventaris/bahanBaku",
  ];

  it("menampilkan grup bila berhak atas setidaknya satu anak", () => {
    expect(bolehBukaGrup(anakInventaris, [IZIN.produk])).toBe(true);
  });

  it("menyembunyikan grup bila tidak berhak atas satu pun anak", () => {
    expect(bolehBukaGrup(anakInventaris, [IZIN.penjualan])).toBe(false);
  });

  it("tidak lagi bergantung pada read-inventory-outlet yang tidak diperiksa backend", () => {
    expect(bolehBukaGrup(anakInventaris, ["read-inventory-outlet"])).toBe(false);
  });
});
