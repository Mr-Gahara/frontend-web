import { describe, expect, it } from "vitest";
import { muatRuang, ringkasanDimuat, type LokasiKerjaSesi, type RuangSumber } from "@/features/notifikasi/ruang";

const SUMBER: RuangSumber[] = ["outlet", "gudang", "toko"];
const dimuat = (lk: LokasiKerjaSesi) => SUMBER.filter((s) => muatRuang(lk, s));

describe("muatRuang (LN20a)", () => {
  it("staf berlokasi kerja Gudang memuat sumber gudang dan toko, tanpa sumber outlet", () => {
    expect(dimuat({ ruang: "gudang", siap: true })).toEqual(["gudang", "toko"]);
  });

  it("staf berlokasi kerja Outlet memuat sumber outlet dan toko, tanpa sumber gudang", () => {
    expect(dimuat({ ruang: "outlet", siap: true })).toEqual(["outlet", "toko"]);
  });

  it("owner, pemegang akses-lintas-outlet, dan staf tanpa lokasi kerja (ruang null) memuat semuanya", () => {
    expect(dimuat({ ruang: null, siap: true })).toEqual(SUMBER);
  });

  it("selama detail diri belum termuat hanya sumber toko yang dimuat", () => {
    expect(dimuat({ ruang: null, siap: false })).toEqual(["toko"]);
  });
});

describe("ringkasanDimuat (LN17a, LN20a)", () => {
  const izinKeduanya = { dashboardOutlet: true, dashboardGudang: true };
  const muatDari = (lk: LokasiKerjaSesi) => (s: RuangSumber) => muatRuang(lk, s);

  it("pemegang izin dashboard outlet tanpa batas ruang memakai ringkasan outlet saja", () => {
    expect(ringkasanDimuat(izinKeduanya, muatDari({ ruang: null, siap: true }))).toEqual({ outlet: true, gudang: false });
  });

  it("staf gudang pemegang izin dashboard outlet beralih ke ringkasan gudang", () => {
    expect(ringkasanDimuat(izinKeduanya, muatDari({ ruang: "gudang", siap: true }))).toEqual({ outlet: false, gudang: true });
  });

  it("staf outlet tidak memuat ringkasan gudang meski tanpa izin dashboard outlet", () => {
    const izin = { dashboardOutlet: false, dashboardGudang: true };
    expect(ringkasanDimuat(izin, muatDari({ ruang: "outlet", siap: true }))).toEqual({ outlet: false, gudang: false });
  });

  it("pengguna gudang saja memakai ringkasan gudang (LN17a)", () => {
    const izin = { dashboardOutlet: false, dashboardGudang: true };
    expect(ringkasanDimuat(izin, muatDari({ ruang: null, siap: true }))).toEqual({ outlet: false, gudang: true });
  });

  it("tidak ada ringkasan yang dimuat sebelum detail diri siap", () => {
    expect(ringkasanDimuat(izinKeduanya, muatDari({ ruang: null, siap: false }))).toEqual({ outlet: false, gudang: false });
  });
});
