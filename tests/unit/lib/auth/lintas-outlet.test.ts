import { describe, expect, it } from "vitest";
import { bolehLintasOutlet, IZIN_LINTAS_OUTLET } from "@/lib/auth/permissions";

describe("bolehLintasOutlet", () => {
  it("selalu false selama nama izin belum ditetapkan backend", () => {
    expect(bolehLintasOutlet(["read-pengajuan-stok", "create-pengajuan-stok"], null)).toBe(false);
    expect(bolehLintasOutlet([], null)).toBe(false);
  });

  it("true hanya bila izin yang ditetapkan dipegang pengguna", () => {
    expect(bolehLintasOutlet(["izin-uji"], "izin-uji")).toBe(true);
    expect(bolehLintasOutlet(["read-pengajuan-stok"], "izin-uji")).toBe(false);
  });

  it("memakai IZIN_LINTAS_OUTLET sebagai bawaan", () => {
    const dimiliki = ["read-pengajuan-stok", ...(IZIN_LINTAS_OUTLET ? [IZIN_LINTAS_OUTLET] : [])];
    expect(bolehLintasOutlet(dimiliki)).toBe(IZIN_LINTAS_OUTLET !== null);
  });
});