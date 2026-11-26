import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { aksesRuang, type RuangKerja } from "@/features/pengguna/lokasi-kerja";
import {
  RUANG_KARTU,
  muatRuang,
  ringkasanDimuat,
  saringKartuRuang,
  type AksesRuangSesi,
  type RuangSumber,
} from "@/features/notifikasi/ruang";
import type { Pemberitahuan } from "@/features/notifikasi/jenis";

const KEDUA_DASHBOARD = ["read-dashboard-outlet", "read-dashboard-gudang"];
const sesi = (permissions: string[], ruang: RuangKerja | null, siap = true): AksesRuangSesi => ({
  ...aksesRuang(permissions, ruang),
  siap,
});
const SUMBER: RuangSumber[] = ["outlet", "gudang", "toko"];
const dimuat = (a: AksesRuangSesi) => SUMBER.filter((s) => muatRuang(a, s));

describe("aksesRuang (LK3a, LN21a; sama dengan pemilih ruang sidebar)", () => {
  it("izin dashboard ruang dan lokasi kerja yang tidak menutupnya", () => {
    expect(aksesRuang(KEDUA_DASHBOARD, null)).toEqual({ outlet: true, gudang: true });
    expect(aksesRuang(KEDUA_DASHBOARD, "gudang")).toEqual({ outlet: false, gudang: true });
    expect(aksesRuang(KEDUA_DASHBOARD, "outlet")).toEqual({ outlet: true, gudang: false });
    expect(aksesRuang(["read-dashboard-gudang"], null)).toEqual({ outlet: false, gudang: true });
  });
});

describe("muatRuang (LN20a, LN21a)", () => {
  it("staf berlokasi kerja Gudang memuat sumber gudang dan toko, tanpa sumber outlet", () => {
    expect(dimuat(sesi(KEDUA_DASHBOARD, "gudang"))).toEqual(["gudang", "toko"]);
  });

  it("staf berlokasi kerja Outlet memuat sumber outlet dan toko, tanpa sumber gudang", () => {
    expect(dimuat(sesi(KEDUA_DASHBOARD, "outlet"))).toEqual(["outlet", "toko"]);
  });

  it("owner, pemegang akses-lintas-outlet, dan staf tanpa lokasi kerja (ruang null) memuat ruang yang izin dashboardnya dipegang", () => {
    expect(dimuat(sesi(KEDUA_DASHBOARD, null))).toEqual(SUMBER);
    expect(dimuat(sesi(["read-dashboard-gudang"], null))).toEqual(["gudang", "toko"]);
  });

  it("selama detail diri belum termuat hanya sumber toko yang dimuat", () => {
    expect(dimuat(sesi(KEDUA_DASHBOARD, null, false))).toEqual(["toko"]);
  });
});

describe("ringkasanDimuat (LN17a, LN20a)", () => {
  const dari = (a: AksesRuangSesi) => ringkasanDimuat((s) => muatRuang(a, s));

  it("yang dapat masuk ruang outlet memakai ringkasan outlet saja", () => {
    expect(dari(sesi(KEDUA_DASHBOARD, null))).toEqual({ outlet: true, gudang: false });
  });

  it("staf gudang pemegang izin dashboard outlet beralih ke ringkasan gudang", () => {
    expect(dari(sesi(KEDUA_DASHBOARD, "gudang"))).toEqual({ outlet: false, gudang: true });
  });

  it("staf outlet tanpa izin dashboard outlet tidak memuat ringkasan gudang", () => {
    expect(dari(sesi(["read-dashboard-gudang"], "outlet"))).toEqual({ outlet: false, gudang: false });
  });

  it("pengguna gudang saja memakai ringkasan gudang (LN17a)", () => {
    expect(dari(sesi(["read-dashboard-gudang"], null))).toEqual({ outlet: false, gudang: true });
  });

  it("tidak ada ringkasan yang dimuat sebelum detail diri siap", () => {
    expect(dari(sesi(KEDUA_DASHBOARD, null, false))).toEqual({ outlet: false, gudang: false });
  });
});

describe("saringKartuRuang (LN21a)", () => {
  const kartu = (id: string): Pemberitahuan => ({ id, tingkat: "info", judul: id, isi: id, tautan: [] });
  const semua = Object.keys(RUANG_KARTU).map(kartu);
  const id = (a: AksesRuangSesi) => saringKartuRuang(semua, a).map((p) => p.id);
  const idRuang = (...r: RuangSumber[]) => Object.keys(RUANG_KARTU).filter((k) => r.includes(RUANG_KARTU[k]));

  it("staf gudang tidak melihat kartu outlet, termasuk langganan dan hasil pengajuan", () => {
    const hasil = id(sesi(KEDUA_DASHBOARD, "gudang"));
    expect(hasil).toEqual(idRuang("gudang", "toko"));
    expect(hasil).not.toContain("langganan");
    expect(hasil).not.toContain("hasil-pengajuan");
  });

  it("staf outlet tidak melihat kartu gudang yang datang dari ringkasan outlet", () => {
    const hasil = id(sesi(KEDUA_DASHBOARD, "outlet"));
    expect(hasil).toEqual(idRuang("outlet", "toko"));
    expect(hasil).not.toContain("pengajuan-menunggu");
  });

  it("tanpa izin dashboard outlet kartu outlet tidak tampil; tanpa batas kartu seluruhnya tampil", () => {
    expect(id(sesi(["read-dashboard-gudang"], null))).toEqual(idRuang("gudang", "toko"));
    expect(id(sesi(KEDUA_DASHBOARD, null))).toEqual(Object.keys(RUANG_KARTU));
  });

  it("kartu yang belum tercantum disembunyikan", () => {
    expect(saringKartuRuang([kartu("kartu-baru")], sesi(KEDUA_DASHBOARD, null))).toEqual([]);
  });

  it("setiap id kartu yang dibuat sumber lonceng tercantum di RUANG_KARTU", () => {
    const dir = join(process.cwd(), "features/notifikasi");
    const ids = new Set<string>();
    for (const f of readdirSync(dir).filter((n) => n.startsWith("sumber-"))) {
      const teks = readFileSync(join(dir, f), "utf8");
      for (const m of teks.matchAll(/\bid: "([a-z-]+)"/g)) ids.add(m[1]);
      for (const m of teks.matchAll(/kartu\(\s*"([a-z-]+)"/g)) ids.add(m[1]);
    }
    expect(ids.size).toBeGreaterThanOrEqual(20);
    expect([...ids].filter((i) => !(i in RUANG_KARTU))).toEqual([]);
    expect(Object.keys(RUANG_KARTU).filter((i) => !ids.has(i))).toEqual([]);
  });
});
