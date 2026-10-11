import { describe, expect, it } from "vitest";
import { bolehBukaHalaman, bolehBukaRute, IZIN } from "@/lib/auth/permissions";

describe("gate stock adjustment", () => {
  it("butuh read-location karena cakupan outlet memanggil /location dan /location/current", () => {
    const href = "/dashboard/outlet/inventaris/stockAdjustment";
    expect(bolehBukaHalaman(href, [IZIN.stockAdjustment])).toBe(false);
    expect(bolehBukaHalaman(href, [IZIN.stockAdjustment, IZIN.location])).toBe(true);
  });

  it("ruang gudang cukup read-stock-adjustment karena tidak memanggil /location", () => {
    const href = "/dashboard/gudang/stockAdjustment";
    expect(bolehBukaHalaman(href, [])).toBe(false);
    expect(bolehBukaHalaman(href, [IZIN.stockAdjustment])).toBe(true);
  });

  it("izin per ruang diterima di daftar ruangnya saja (keputusan RH3a)", () => {
    const outlet = "/dashboard/outlet/inventaris/stockAdjustment";
    const gudang = "/dashboard/gudang/stockAdjustment";
    expect(bolehBukaHalaman(outlet, [IZIN.stockAdjustmentOutlet, IZIN.location])).toBe(true);
    expect(bolehBukaHalaman(outlet, [IZIN.stockAdjustmentOutlet])).toBe(false);
    expect(bolehBukaHalaman(outlet, [IZIN.stockAdjustmentGudang, IZIN.location])).toBe(false);
    expect(bolehBukaHalaman(gudang, [IZIN.stockAdjustmentGudang])).toBe(true);
    expect(bolehBukaHalaman(gudang, [IZIN.stockAdjustmentOutlet])).toBe(false);
  });

  it("izin per ruang membuka detail ruangnya saja lewat gerbang rute (keputusan RH3a)", () => {
    const outlet = "/dashboard/outlet/inventaris/stockAdjustment/6a00000000000000000000aa";
    const gudang = "/dashboard/gudang/stockAdjustment/6a00000000000000000000aa";
    expect(bolehBukaRute(outlet, [IZIN.stockAdjustmentOutlet])).toBe(true);
    expect(bolehBukaRute(outlet, [IZIN.stockAdjustmentGudang])).toBe(false);
    expect(bolehBukaRute(gudang, [IZIN.stockAdjustmentGudang])).toBe(true);
    expect(bolehBukaRute(gudang, [IZIN.stockAdjustmentOutlet])).toBe(false);
    expect(bolehBukaRute(gudang, [IZIN.stockAdjustment])).toBe(true);
  });
});