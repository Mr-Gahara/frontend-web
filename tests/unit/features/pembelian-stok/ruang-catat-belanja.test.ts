import { describe, expect, it } from "vitest";
import { ruangCatatBelanja } from "@/features/pembelian-stok/ruang";

/** Izin halaman catat (IZIN_HALAMAN) selain izin buat pembelian. */
const DASAR = ["read-bahan", "read-akunkas", "read-location"];
const OWNER = [...DASAR, "create-pembelian-stok", "read-dashboard-gudang"];

describe("ruangCatatBelanja (tombol Catat pembelian di Belanja Stok)", () => {
  it("Basic dan Advanced hanya outlet walau izinnya penuh, karena gudang milik Pro", () => {
    expect(ruangCatatBelanja({ permissions: OWNER, plan: "basic", adaGudang: false })).toEqual(["outlet"]);
    expect(ruangCatatBelanja({ permissions: OWNER, plan: "advanced", adaGudang: true })).toEqual(["outlet"]);
  });

  it("Pro dengan gudang dan izin penuh: outlet dan gudang", () => {
    expect(ruangCatatBelanja({ permissions: OWNER, plan: "pro", adaGudang: true })).toEqual(["outlet", "gudang"]);
  });

  it("Pro tanpa lokasi Gudang atau tanpa read-dashboard-gudang: outlet saja", () => {
    expect(ruangCatatBelanja({ permissions: OWNER, plan: "pro", adaGudang: false })).toEqual(["outlet"]);
    const tanpaDashboard = OWNER.filter((p) => p !== "read-dashboard-gudang");
    expect(ruangCatatBelanja({ permissions: tanpaDashboard, plan: "pro", adaGudang: true })).toEqual(["outlet"]);
  });

  it("izin buat per ruang hanya membuka ruangnya", () => {
    const gudang = [...DASAR, "create-pembelian-stok-gudang", "read-dashboard-gudang"];
    expect(ruangCatatBelanja({ permissions: gudang, plan: "pro", adaGudang: true })).toEqual(["gudang"]);
    const outlet = [...DASAR, "create-pembelian-stok-outlet"];
    expect(ruangCatatBelanja({ permissions: outlet, plan: "pro", adaGudang: true })).toEqual(["outlet"]);
  });

  it("tanpa izin buat atau tanpa izin halaman catat: tidak ada ruang", () => {
    expect(ruangCatatBelanja({ permissions: DASAR, plan: "pro", adaGudang: true })).toEqual([]);
    const tanpaBahan = OWNER.filter((p) => p !== "read-bahan");
    expect(ruangCatatBelanja({ permissions: tanpaBahan, plan: "basic", adaGudang: false })).toEqual([]);
  });
});
