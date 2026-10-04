import { describe, it, expect } from "vitest";
import { nilaiAwalRole } from "@/features/role/nilai-awal";
import { IZIN_DASAR, IZIN_TERLARANG } from "@/features/role/constants";
import type { Permission } from "@/types/role";

describe("nilaiAwalRole", () => {
  it("tanpa detail: isian kosong dan wewenang dasar terpilih", () => {
    const awal = nilaiAwalRole();
    expect(awal.namaRole).toBe("");
    expect(awal.deskripsi).toBe("");
    expect(awal.level).toBe("");
    expect(awal.izinTerpilih).toEqual(IZIN_DASAR);
    expect(awal.izinTerpilih).not.toBe(IZIN_DASAR);
    expect(awal.izinTersembunyi).toEqual([]);
  });

  it("dengan detail: nama, deskripsi, dan level dari posisi itu", () => {
    const awal = nilaiAwalRole({
      namaRole: "Kasir",
      deskripsi: null,
      level: 10,
      permissions: [],
    });
    expect(awal.namaRole).toBe("Kasir");
    expect(awal.deskripsi).toBe("");
    expect(awal.level).toBe("10");
    expect(awal.izinTerpilih).toEqual([]);
  });

  it("izin berupa objek dibaca dari namanya", () => {
    const izinObjek = { nama: "izin-uji-objek" } as Permission;
    const awal = nilaiAwalRole({ permissions: ["izin-uji-teks", izinObjek] });
    expect(awal.izinTerpilih).toEqual(["izin-uji-teks", "izin-uji-objek"]);
    expect(awal.level).toBe("");
  });

  it("wewenang terlarang dipisah dari yang tampil", () => {
    const awal = nilaiAwalRole({
      permissions: [...IZIN_TERLARANG, "izin-uji-teks"],
    });
    expect(awal.izinTerpilih).toEqual(["izin-uji-teks"]);
    expect(awal.izinTersembunyi).toEqual(IZIN_TERLARANG);
  });
});