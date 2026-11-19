import { describe, it, expect, vi } from "vitest";
import { FILTER_KOSONG, jumlahFilterAktif, pilFilterPenjualan } from "@/features/penjualan/filter-panel";

const HARI_INI = new Date(2026, 10, 19);

describe("jumlahFilterAktif", () => {
  it("nol untuk filter kosong, periode dihitung satu", () => {
    expect(jumlahFilterAktif(FILTER_KOSONG)).toBe(0);
    expect(jumlahFilterAktif({ ...FILTER_KOSONG, startDate: "2026-11-01", endDate: "2026-11-19" })).toBe(1);
    expect(
      jumlahFilterAktif({ ...FILTER_KOSONG, statusPenjualan: "PAID", jenisTransaksi: "POS", endDate: "2026-11-19" }),
    ).toBe(3);
  });
});

describe("pilFilterPenjualan", () => {
  it("label pil memakai label tampilan, dan periode cepat disebut namanya", () => {
    const pil = pilFilterPenjualan(
      { statusPenjualan: "UNPAID", jenisTransaksi: "POS", jenisPenjualan: "dine-in", startDate: "2026-11-01", endDate: "2026-11-19" },
      HARI_INI,
      () => {},
    );
    expect(pil.map((p) => p.label)).toEqual([
      "Status: Belum Bayar",
      "Tipe: POS Kasir",
      "Metode: Dine-in",
      "Bulan ini · 1 – 19 Nov 2026",
    ]);
  });

  it("menghapus satu pil menerapkan filter tanpa isian itu saja", () => {
    const terapkan = vi.fn();
    const f = { ...FILTER_KOSONG, statusPenjualan: "PAID" as const, startDate: "2026-11-01", endDate: "2026-11-19" };
    const pil = pilFilterPenjualan(f, HARI_INI, terapkan);
    pil.find((p) => p.kunci === "periode")!.onHapus();
    expect(terapkan).toHaveBeenCalledWith({ ...f, startDate: "", endDate: "" });
    pil.find((p) => p.kunci === "status")!.onHapus();
    expect(terapkan).toHaveBeenLastCalledWith({ ...f, statusPenjualan: undefined });
  });

  it("tanpa filter tidak ada pil", () => {
    expect(pilFilterPenjualan(FILTER_KOSONG, HARI_INI, () => {})).toEqual([]);
  });
});
