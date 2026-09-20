import { describe, expect, it } from "vitest";
import type { Lokasi } from "@/types/location";
import {
  lingkupOutlet,
  SEMUA_OUTLET,
  tentukanCakupan,
  type MasukanCakupan,
} from "@/features/inventaris/cakupan";

const outletA = { id: "o1", nama: "Outlet A", tipe: "Outlet" } as Lokasi;
const gudang = { id: "g1", nama: "Gudang Pusat", tipe: "Gudang" } as Lokasi;

const dasar: MasukanCakupan = {
  sesiMemuat: false,
  owner: false,
  daftarLokasi: undefined,
  gagalDaftar: false,
  lokasiAktif: null,
  memuatAktif: false,
  gagalAktif: false,
};

describe("tentukanCakupan", () => {
  it("menunggu selama sesi dipulihkan, termasuk untuk owner", () => {
    expect(tentukanCakupan({ ...dasar, sesiMemuat: true, owner: true })).toEqual({
      status: "memuat",
    });
  });

  it("owner mendapat seluruh lokasi bertipe Outlet setelah daftar termuat", () => {
    expect(tentukanCakupan({ ...dasar, owner: true })).toEqual({ status: "memuat" });
    expect(tentukanCakupan({ ...dasar, owner: true, gagalDaftar: true })).toEqual({
      status: "gagal",
    });
    expect(
      tentukanCakupan({ ...dasar, owner: true, daftarLokasi: [outletA, gudang] }),
    ).toEqual({ status: "owner", lokasiOutlet: [outletA] });
  });

  it("staf mendapat lokasi aktif, termasuk keadaan tanpa lokasi", () => {
    expect(tentukanCakupan({ ...dasar, memuatAktif: true })).toEqual({ status: "memuat" });
    expect(tentukanCakupan({ ...dasar, gagalAktif: true })).toEqual({ status: "gagal" });
    expect(tentukanCakupan({ ...dasar, lokasiAktif: outletA })).toEqual({
      status: "staf",
      lokasi: outletA,
      lokasiId: "o1",
    });
    expect(tentukanCakupan(dasar)).toEqual({ status: "staf", lokasi: null, lokasiId: "" });
  });
});

describe("lingkupOutlet", () => {
  it("owner: semua outlet disaring di klien, satu outlet dikirim ke server", () => {
    const owner = { status: "owner" as const, lokasiOutlet: [outletA] };
    expect(lingkupOutlet(owner, SEMUA_OUTLET)).toEqual({ tipeLokasi: "Outlet" });
    expect(lingkupOutlet(owner, "o1")).toEqual({ locationID: "o1" });
  });

  it("staf selalu dibatasi lokasi aktif, dan tidak memuat apa pun tanpa lokasi", () => {
    expect(
      lingkupOutlet({ status: "staf", lokasi: outletA, lokasiId: "o1" }, SEMUA_OUTLET),
    ).toEqual({ locationID: "o1" });
    expect(lingkupOutlet({ status: "staf", lokasi: null, lokasiId: "" }, SEMUA_OUTLET)).toBeNull();
    expect(lingkupOutlet({ status: "memuat" }, SEMUA_OUTLET)).toBeNull();
    expect(lingkupOutlet({ status: "gagal" }, SEMUA_OUTLET)).toBeNull();
  });
});