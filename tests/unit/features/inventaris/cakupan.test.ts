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
  lintasOutlet: false,
  daftarLokasi: undefined,
  gagalDaftar: false,
  lokasiAktif: null,
  memuatAktif: false,
  gagalAktif: false,
};

describe("tentukanCakupan", () => {
  it("menunggu selama sesi dipulihkan, termasuk untuk pemegang izin lintas outlet", () => {
    expect(tentukanCakupan({ ...dasar, sesiMemuat: true, lintasOutlet: true })).toEqual({
      status: "memuat",
    });
  });

  it("pemegang izin lintas outlet mendapat seluruh lokasi bertipe Outlet setelah daftar termuat", () => {
    expect(tentukanCakupan({ ...dasar, lintasOutlet: true })).toEqual({ status: "memuat" });
    expect(tentukanCakupan({ ...dasar, lintasOutlet: true, gagalDaftar: true })).toEqual({
      status: "gagal",
    });
    expect(
      tentukanCakupan({ ...dasar, lintasOutlet: true, daftarLokasi: [outletA, gudang] }),
    ).toEqual({ status: "lintas", lokasiOutlet: [outletA] });
  });

  it("tanpa izin lintas outlet terkunci ke lokasi aktif, termasuk keadaan tanpa lokasi", () => {
    expect(tentukanCakupan({ ...dasar, memuatAktif: true })).toEqual({ status: "memuat" });
    expect(tentukanCakupan({ ...dasar, gagalAktif: true })).toEqual({ status: "gagal" });
    expect(tentukanCakupan({ ...dasar, lokasiAktif: outletA })).toEqual({
      status: "terkunci",
      lokasi: outletA,
      lokasiId: "o1",
    });
    expect(tentukanCakupan(dasar)).toEqual({ status: "terkunci", lokasi: null, lokasiId: "" });
  });
});

describe("lingkupOutlet", () => {
  it("lintas outlet: semua outlet disaring di klien, satu outlet dikirim ke server", () => {
    const lintas = { status: "lintas" as const, lokasiOutlet: [outletA] };
    expect(lingkupOutlet(lintas, SEMUA_OUTLET)).toEqual({ tipeLokasi: "Outlet" });
    expect(lingkupOutlet(lintas, "o1")).toEqual({ locationID: "o1" });
  });

  it("terkunci: selalu dibatasi lokasi aktif, dan tidak memuat apa pun tanpa lokasi", () => {
    expect(
      lingkupOutlet({ status: "terkunci", lokasi: outletA, lokasiId: "o1" }, SEMUA_OUTLET),
    ).toEqual({ locationID: "o1" });
    expect(lingkupOutlet({ status: "terkunci", lokasi: null, lokasiId: "" }, SEMUA_OUTLET)).toBeNull();
    expect(lingkupOutlet({ status: "memuat" }, SEMUA_OUTLET)).toBeNull();
    expect(lingkupOutlet({ status: "gagal" }, SEMUA_OUTLET)).toBeNull();
  });
});