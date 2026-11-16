import { describe, expect, it } from "vitest";
import {
  lokasiKerjaDikirim,
  pilihanLokasiKerja,
  roleOwner,
  ruangDariPath,
  ruangDitolak,
  ruangLokasiKerja,
  tampilkanLokasiKerja,
} from "@/features/pengguna/lokasi-kerja";
import type { Lokasi } from "@/types/location";
import type { Role } from "@/types/role";

const lokasi = (id: string, nama: string, tipe: string) => ({ id, nama, tipe }) as Lokasi;

describe("lokasi kerja pengguna (B269)", () => {
  it("pilihan hanya Outlet dan Gudang, Outlet lebih dulu, lalu menurut nama", () => {
    const hasil = pilihanLokasiKerja([
      lokasi("g2", "Gudang B", "Gudang"),
      lokasi("x", "Kantor", "Kantor"),
      lokasi("g1", "Gudang A", "Gudang"),
      lokasi("o1", "Outlet Kota", "Outlet"),
    ]);
    expect(hasil.map((l) => l.id)).toEqual(["o1", "g1", "g2"]);
  });

  it("role Owner dikenali dari level, bukan nama", () => {
    const roles = [
      { id: "own", namaRole: "Pemilik", level: 100 },
      { id: "kas", namaRole: "Owner", level: 10 },
    ] as Role[];
    expect(roleOwner(roles, "own")).toBe(true);
    expect(roleOwner(roles, "kas")).toBe(false);
    expect(roleOwner(roles, "")).toBe(false);
  });

  it("isian tampil hanya dengan read-location dan untuk pengguna bukan Owner", () => {
    expect(tampilkanLokasiKerja(true, false)).toBe(true);
    expect(tampilkanLokasiKerja(false, false)).toBe(false);
    expect(tampilkanLokasiKerja(true, true)).toBe(false);
  });

  it("dikirim hanya bila berubah dari nilai tersimpan, termasuk kembali ke null", () => {
    expect(lokasiKerjaDikirim(null, null)).toBeUndefined();
    expect(lokasiKerjaDikirim("g1", "g1")).toBeUndefined();
    expect(lokasiKerjaDikirim("g1", null)).toBe("g1");
    expect(lokasiKerjaDikirim(null, "g1")).toBeNull();
    expect(lokasiKerjaDikirim("o1", "g1")).toBe("o1");
  });
});

describe("ruang mengikuti lokasi kerja (LK3a)", () => {
  it("staf berlokasi kerja hanya punya ruang lokasinya", () => {
    expect(ruangLokasiKerja({ tipe: "Outlet" }, false)).toBe("outlet");
    expect(ruangLokasiKerja({ tipe: "Gudang" }, false)).toBe("gudang");
  });

  it("tidak dibatasi bila lintas outlet atau tanpa lokasi kerja", () => {
    expect(ruangLokasiKerja({ tipe: "Gudang" }, true)).toBeNull();
    expect(ruangLokasiKerja(null, false)).toBeNull();
    expect(ruangLokasiKerja(undefined, false)).toBeNull();
  });

  it("ruang dibaca dari awalan path dashboard", () => {
    expect(ruangDariPath("/dashboard/outlet")).toBe("outlet");
    expect(ruangDariPath("/dashboard/outlet/pengaturan/pajak")).toBe("outlet");
    expect(ruangDariPath("/dashboard/gudang/stockOpname")).toBe("gudang");
    expect(ruangDariPath("/dashboard/profil")).toBeNull();
    expect(ruangDariPath("/dashboard/outletku")).toBeNull();
  });

  it("menolak seluruh ruang lain, termasuk halaman tingkat toko, tetapi bukan profil", () => {
    expect(ruangDitolak("/dashboard/outlet/pengaturan/pajak", "gudang")).toBe(true);
    expect(ruangDitolak("/dashboard/gudang", "outlet")).toBe(true);
    expect(ruangDitolak("/dashboard/gudang/inventaris", "gudang")).toBe(false);
    expect(ruangDitolak("/dashboard/profil", "gudang")).toBe(false);
    expect(ruangDitolak("/dashboard/outlet", null)).toBe(false);
  });
});
