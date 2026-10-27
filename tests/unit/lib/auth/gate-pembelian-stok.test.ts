import { describe, expect, it } from "vitest";
import { bolehBukaHalaman, bolehBukaRute, IZIN } from "@/lib/auth/permissions";

const OUTLET = "/dashboard/outlet/inventaris/pembelianStok";
const GUDANG = "/dashboard/gudang/pembelianStok";
const ID = "6a00000000000000000000aa";
const DASAR_CATAT = [IZIN.bahan, IZIN.akunKas, IZIN.location];

describe("gate pembelian stok per ruang (B116)", () => {
  it("izin umum membuka daftar, detail, dan catat di kedua ruang", () => {
    const umum = [IZIN.pembelianStok, IZIN.buatPembelianStok, ...DASAR_CATAT];
    for (const ruang of [OUTLET, GUDANG]) {
      expect(bolehBukaHalaman(ruang, umum)).toBe(true);
      expect(bolehBukaRute(`${ruang}/${ID}`, umum)).toBe(true);
      expect(bolehBukaHalaman(`${ruang}/catatPembelian`, umum)).toBe(true);
    }
  });

  it("izin baca per ruang membuka daftar ruangnya saja", () => {
    expect(bolehBukaHalaman(OUTLET, [IZIN.pembelianStokOutlet, IZIN.location])).toBe(true);
    expect(bolehBukaHalaman(OUTLET, [IZIN.pembelianStokGudang, IZIN.location])).toBe(false);
    expect(bolehBukaHalaman(GUDANG, [IZIN.pembelianStokGudang, IZIN.location])).toBe(true);
    expect(bolehBukaHalaman(GUDANG, [IZIN.pembelianStokOutlet, IZIN.location])).toBe(false);
  });

  it("daftar tetap menuntut read-location bersama izin ruangnya", () => {
    expect(bolehBukaHalaman(OUTLET, [IZIN.pembelianStokOutlet])).toBe(false);
    expect(bolehBukaHalaman(GUDANG, [IZIN.pembelianStokGudang])).toBe(false);
  });

  it("izin baca per ruang membuka detail ruangnya saja lewat gerbang rute", () => {
    expect(bolehBukaRute(`${OUTLET}/${ID}`, [IZIN.pembelianStokOutlet, IZIN.location])).toBe(true);
    expect(bolehBukaRute(`${OUTLET}/${ID}`, [IZIN.pembelianStokGudang, IZIN.location])).toBe(false);
    expect(bolehBukaRute(`${GUDANG}/${ID}`, [IZIN.pembelianStokGudang, IZIN.location])).toBe(true);
    expect(bolehBukaRute(`${GUDANG}/${ID}`, [IZIN.pembelianStokOutlet, IZIN.location])).toBe(false);
  });

  it("izin catat per ruang membuka halaman catat ruangnya saja", () => {
    expect(bolehBukaHalaman(`${OUTLET}/catatPembelian`, [...DASAR_CATAT, IZIN.buatPembelianStokOutlet])).toBe(true);
    expect(bolehBukaHalaman(`${OUTLET}/catatPembelian`, [...DASAR_CATAT, IZIN.buatPembelianStokGudang])).toBe(false);
    expect(bolehBukaHalaman(`${GUDANG}/catatPembelian`, [...DASAR_CATAT, IZIN.buatPembelianStokGudang])).toBe(true);
    expect(bolehBukaHalaman(`${GUDANG}/catatPembelian`, [...DASAR_CATAT, IZIN.buatPembelianStokOutlet])).toBe(false);
  });

  it("detail tidak menuntut read-location, karena lokasinya ter-populate (B112)", () => {
    expect(bolehBukaRute(OUTLET + "/" + ID, [IZIN.pembelianStokOutlet])).toBe(true);
    expect(bolehBukaRute(GUDANG + "/" + ID, [IZIN.pembelianStokGudang])).toBe(true);
  });

  it("Belanja Stok terbuka bagi izin baca umum atau salah satu izin ruang", () => {
    const href = "/dashboard/outlet/keuangan/belanjaStok";
    const dasar = [IZIN.akunKas, IZIN.location];
    expect(bolehBukaHalaman(href, dasar)).toBe(false);
    for (const izin of [IZIN.pembelianStok, IZIN.pembelianStokOutlet, IZIN.pembelianStokGudang]) {
      expect(bolehBukaHalaman(href, [...dasar, izin])).toBe(true);
    }
  });
});