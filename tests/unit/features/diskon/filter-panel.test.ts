import { describe, it, expect, vi } from "vitest";
import { FILTER_DISKON_AWAL, jumlahFilterDiskon, pilFilterDiskon } from "@/features/diskon/tampilan";

describe("filter panel diskon (FL1a, FL4a)", () => {
  it("bawaan Semua tidak dihitung dan tanpa pil", () => {
    expect(jumlahFilterDiskon(FILTER_DISKON_AWAL)).toBe(0);
    expect(pilFilterDiskon(FILTER_DISKON_AWAL, () => {})).toEqual([]);
  });

  it("pil berlabel tampilan, dan menghapus satu pil hanya mengosongkan isian itu", () => {
    const terapkan = vi.fn();
    const f = { status: "Non-Aktif", cakupan: "all", tipe: "persen" } as const;
    expect(jumlahFilterDiskon(f)).toBe(2);
    const pil = pilFilterDiskon(f, terapkan);
    expect(pil.map((p) => p.label)).toEqual(["Status: Non-Aktif", "Tipe: Persen"]);
    pil[1].onHapus();
    expect(terapkan).toHaveBeenCalledWith({ ...f, tipe: "all" });
  });
});
