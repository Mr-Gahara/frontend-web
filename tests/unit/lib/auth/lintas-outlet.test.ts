import { describe, expect, it } from "vitest";
import { bolehLintasOutlet, IZIN_LINTAS_OUTLET } from "@/lib/auth/permissions";

describe("bolehLintasOutlet", () => {
  it("selalu false bila nama izin null", () => {
    expect(bolehLintasOutlet(["read-pengajuan-stok", "create-pengajuan-stok"], null)).toBe(false);
    expect(bolehLintasOutlet([], null)).toBe(false);
  });

  it("true hanya bila izin yang ditetapkan dipegang pengguna", () => {
    expect(bolehLintasOutlet(["izin-uji"], "izin-uji")).toBe(true);
    expect(bolehLintasOutlet(["read-pengajuan-stok"], "izin-uji")).toBe(false);
  });

  it("memakai akses-lintas-outlet dari backend sebagai bawaan (B142)", () => {
    expect(IZIN_LINTAS_OUTLET).toBe("akses-lintas-outlet");
    expect(bolehLintasOutlet(["read-pengajuan-stok", "akses-lintas-outlet"])).toBe(true);
    expect(bolehLintasOutlet(["read-pengajuan-stok"])).toBe(false);
  });
});