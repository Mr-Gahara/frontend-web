import { describe, expect, it } from "vitest";
import { bacaPlanToken, bolehMenurutPlan, fiturRute, planMencakup } from "@/lib/auth/fitur-plan";
import { fiturPerluSetup, type StatusSetup } from "@/features/setup/status";

describe("fitur per plan (butir 5)", () => {
  it("plan token: nilai tidak dikenal atau kosong dibaca Basic", () => {
    expect(bacaPlanToken("pro")).toBe("pro");
    expect(bacaPlanToken(undefined)).toBe("basic");
    expect(bacaPlanToken("enterprise")).toBe("basic");
  });

  it("sesi booking mulai Advanced, gudang hanya Pro", () => {
    expect(planMencakup("basic", "sesi-booking")).toBe(false);
    expect(planMencakup("advanced", "sesi-booking")).toBe(true);
    expect(planMencakup("advanced", "wms")).toBe(false);
    expect(planMencakup("pro", "wms")).toBe(true);
  });

  it("rute fitur dikenali per awalan, dan Pembelian Stok outlet ada di semua plan", () => {
    expect(fiturRute("/dashboard/outlet/reservasi")).toBe("sesi-booking");
    expect(fiturRute("/dashboard/outlet/reservasi/aset/buatAset")).toBe("sesi-booking");
    expect(fiturRute("/dashboard/gudang/stockOpname")).toBe("wms");
    expect(fiturRute("/dashboard/outlet/inventaris/pengajuanStok/abc")).toBe("wms");
    expect(fiturRute("/dashboard/outlet/inventaris/pembelianStok")).toBeNull();
    expect(fiturRute("/dashboard/outlet/reservasiku")).toBeNull();
    expect(bolehMenurutPlan("/dashboard/outlet/inventaris/penerimaanBarang", "advanced")).toBe(false);
    expect(bolehMenurutPlan("/dashboard/outlet/penjualan", "basic")).toBe(true);
  });
});

describe("fiturPerluSetup", () => {
  const status = (booking: { termasukPlan: boolean; selesai: boolean }, wms: { termasukPlan: boolean; selesai: boolean }) =>
    ({
      fitur: {
        "sesi-booking": { ...booking, selesaiPada: null },
        wms: { ...wms, selesaiPada: null },
      },
    }) as unknown as StatusSetup;
  const semuaIzin = ["create-tipe-aset", "create-aset", "create-tarif", "create-location"];

  it("hanya fitur termasuk plan yang belum selesai", () => {
    expect(fiturPerluSetup(status({ termasukPlan: true, selesai: false }, { termasukPlan: false, selesai: false }), semuaIzin)).toEqual([
      "sesi-booking",
    ]);
    expect(fiturPerluSetup(status({ termasukPlan: true, selesai: true }, { termasukPlan: true, selesai: false }), semuaIzin)).toEqual([
      "wms",
    ]);
  });

  it("hanya bagi pemegang izin buat data setup fitur itu", () => {
    const s = status({ termasukPlan: true, selesai: false }, { termasukPlan: true, selesai: false });
    expect(fiturPerluSetup(s, ["create-location"])).toEqual(["wms"]);
    expect(fiturPerluSetup(s, ["create-aset", "create-tarif"])).toEqual([]);
  });
});
