import { describe, expect, it } from "vitest";
import { penggunaDiRuang, ruangPengguna } from "@/features/pengguna/ruang-staf";

// RS1a: lokasi kerja, lalu izin dashboard (daftar ruang backend), lalu outlet.
const owner = { id: "owner", locationID: null };
const kasirApp = { id: "kasir", locationID: "lok-outlet" };
const stafTanpaApa = { id: "staf", locationID: null };
const petugasGudangLokasi = { id: "petugas", locationID: "lok-gudang" };
const adminDuaRuang = { id: "admin", locationID: null };
const lokasiTakDikenal = { id: "asing", locationID: "lok-lain" };

const data = {
  semua: [owner, kasirApp, stafTanpaApa, petugasGudangLokasi, adminDuaRuang, lokasiTakDikenal],
  // Backend getByWorkspace: Owner selalu, lalu yang role-nya berizin dashboard ruang.
  diRuangBackend: {
    outlet: new Set(["owner", "admin", "petugas"]),
    gudang: new Set(["owner", "admin", "asing"]),
  },
  tipeLokasi: new Map([
    ["lok-outlet", "Outlet"],
    ["lok-gudang", "Gudang"],
  ]),
};

describe("ruangPengguna (RS1a)", () => {
  it("lokasi kerja menentukan ruang, mengalahkan izin dashboard", () => {
    expect(ruangPengguna(kasirApp, data)).toEqual(["outlet"]);
    // Berizin dashboard outlet, tetapi lokasi kerjanya gudang.
    expect(ruangPengguna(petugasGudangLokasi, data)).toEqual(["gudang"]);
  });

  it("tanpa lokasi kerja: izin dashboard dari daftar backend; Owner dan admin dua ruang", () => {
    expect(ruangPengguna(owner, data)).toEqual(["outlet", "gudang"]);
    expect(ruangPengguna(adminDuaRuang, data)).toEqual(["outlet", "gudang"]);
  });

  it("tanpa lokasi kerja dan tanpa izin dashboard (akses aplikasi saja): ruang outlet", () => {
    expect(ruangPengguna(stafTanpaApa, data)).toEqual(["outlet"]);
  });

  it("lokasi kerja yang tipenya tidak diketahui dilewati ke izin dashboard", () => {
    expect(ruangPengguna(lokasiTakDikenal, data)).toEqual(["gudang"]);
  });

  it("penggunaDiRuang: staf akses aplikasi kini tampil di outlet; urutan daftar dipertahankan", () => {
    expect(penggunaDiRuang("outlet", data).map((p) => p.id)).toEqual(["owner", "kasir", "staf", "admin"]);
    expect(penggunaDiRuang("gudang", data).map((p) => p.id)).toEqual(["owner", "petugas", "admin", "asing"]);
  });
});
