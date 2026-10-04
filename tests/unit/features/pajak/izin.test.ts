import { describe, expect, it } from "vitest";
import { aksiPajak, URL_PAJAK } from "@/features/pajak/izin";
import { bolehBukaHalaman } from "@/lib/auth/permissions";

describe("aksiPajak", () => {
  it("tanpa izin: tidak ada aksi yang tersedia", () => {
    expect(aksiPajak([])).toEqual({ buat: false, ubah: false, hapus: false, pasang: false });
  });

  it("setiap aksi mengikuti izin endpoint-nya sendiri", () => {
    expect(aksiPajak(["create-pajak"])).toMatchObject({ buat: true, ubah: false, hapus: false });
    expect(aksiPajak(["update-pajak"])).toMatchObject({ buat: false, ubah: true, hapus: false });
    expect(aksiPajak(["delete-pajak"])).toMatchObject({ buat: false, ubah: false, hapus: true });
  });

  it("pasang dan lepas pajak produk memakai update-produk, bukan izin pajak", () => {
    expect(aksiPajak(["update-pajak", "create-pajak"]).pasang).toBe(false);
    expect(aksiPajak(["update-produk"]).pasang).toBe(true);
  });
});

describe("gerbang halaman pajak", () => {
  it("terbuka bagi pemegang read-pajak", () => {
    expect(bolehBukaHalaman(URL_PAJAK, ["read-pajak"])).toBe(true);
  });

  it("terbuka bagi pemegang akses-pos, sama dengan GET /pajak di backend", () => {
    expect(bolehBukaHalaman(URL_PAJAK, ["akses-pos"])).toBe(true);
  });

  it("tertutup tanpa keduanya, walau memegang izin tulis pajak", () => {
    expect(bolehBukaHalaman(URL_PAJAK, [])).toBe(false);
    expect(bolehBukaHalaman(URL_PAJAK, ["create-pajak", "update-pajak"])).toBe(false);
  });
});