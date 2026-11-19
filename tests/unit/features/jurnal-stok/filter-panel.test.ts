import { describe, it, expect, vi } from "vitest";
import { jumlahFilterJurnal, opsiAlasanJurnal, periodeAwalJurnal, pilFilterJurnal, type FilterPanelJurnal } from "@/features/jurnal-stok/filter";
import { pilFilterOpname } from "@/features/stock-opname/filter";

const HARI_INI = new Date(2026, 10, 19);
const bawaan: FilterPanelJurnal = { arah: "ALL", alasan: "ALL", ...periodeAwalJurnal(HARI_INI) };

describe("filter panel jurnal stok (FL1a, FL11a)", () => {
  it("bawaan tidak dihitung; arah, alasan, dan periode yang diubah dihitung", () => {
    expect(jumlahFilterJurnal(bawaan, bawaan)).toBe(0);
    expect(jumlahFilterJurnal({ ...bawaan, arah: "Keluar", alasan: "Penjualan", dari: new Date(2026, 10, 10) }, bawaan)).toBe(3);
  });

  it("label alasan transfer mengikuti ruang", () => {
    expect(opsiAlasanJurnal("Transfer Distribusi")[0]).toEqual({ nilai: "Transfer Gudang", label: "Transfer Distribusi" });
    const pil = pilFilterJurnal({ ...bawaan, alasan: "Transfer Gudang" }, bawaan, "Suplai / Transfer", HARI_INI, () => {});
    expect(pil.map((p) => p.label)).toEqual(["Alasan: Suplai / Transfer"]);
  });

  it("menghapus pil arah mengembalikan Semua tanpa menyentuh isian lain", () => {
    const terapkan = vi.fn();
    const f = { ...bawaan, arah: "Masuk" as const, alasan: "Pembelian" as const };
    const pil = pilFilterJurnal(f, bawaan, "x", HARI_INI, terapkan);
    expect(pil[0].label).toBe("Arah: Barang Masuk");
    pil[0].onHapus();
    expect(terapkan).toHaveBeenCalledWith({ ...f, arah: "ALL" });
  });
});

describe("pil status stock opname", () => {
  it("Semua tanpa pil, status lain berlabel tampilan", () => {
    expect(pilFilterOpname("ALL", () => {})).toEqual([]);
    const terapkan = vi.fn();
    const [pil] = pilFilterOpname("SUBMITTED", terapkan);
    expect(pil.label).toBe("Status: Menunggu Review");
    pil.onHapus();
    expect(terapkan).toHaveBeenCalledWith("ALL");
  });
});
