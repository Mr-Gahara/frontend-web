import { describe, expect, it } from "vitest";
import { bolehBukaHalaman, IZIN } from "@/lib/auth/permissions";

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
});