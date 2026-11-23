import { describe, expect, it } from "vitest";
import { bulanSesudahIni, geserBulan, keBulan, labelBulan, labelFilterEkspor, paramEkspor } from "@/lib/unduh";

describe("ekspor daftar (P85)", () => {
  it("membuang page, limit, dan kunci tanggal, karena ekspor memakai bulan", () => {
    expect(paramEkspor({ page: "2", limit: "10", dari: "2026-11-01", sampai: "2026-11-23", status: "AKTIF", cari: "" })).toEqual({
      status: "AKTIF",
    });
    expect(
      paramEkspor({ startDate: "2026-11-01", endDate: "2026-11-23", statusPenjualan: "PAID", sort: "totalTagihan" }, ["startDate", "endDate"]),
    ).toEqual({ statusPenjualan: "PAID", sort: "totalTagihan" });
  });

  it("label filter tanpa periode, dengan pencarian di depan", () => {
    const pil = [
      { kunci: "status", label: "Status: Aktif", onHapus: () => {} },
      { kunci: "periode", label: "Bulan Ini · 1-23 Nov", onHapus: () => {} },
    ];
    expect(labelFilterEkspor(pil, { label: "Supplier", nilai: " CV Manis " })).toEqual(["Supplier: CV Manis", "Status: Aktif"]);
    expect(labelFilterEkspor(pil)).toEqual(["Status: Aktif"]);
  });

  it("bulan YYYY-MM, geser, label, dan bulan yang belum datang", () => {
    const nov = new Date(2026, 10, 23);
    expect(keBulan(nov)).toBe("2026-11");
    expect(keBulan(geserBulan(nov, -11))).toBe("2025-12");
    expect(labelBulan(geserBulan(nov, 0))).toBe("November 2026");
    expect(bulanSesudahIni(geserBulan(nov, 1), nov)).toBe(true);
    expect(bulanSesudahIni(geserBulan(nov, 0), nov)).toBe(false);
  });
});
