import { describe, expect, it } from "vitest";
import { bolehKembaliTabel, tabelMeluber } from "@/components/ui/use-kartu-bila-tak-muat";

/**
 * LT1a: DataTable tampil sebagai kartu bila lebar alami tabelnya melebihi
 * wadah. Angka dari pengukuran 17 November 2026: stock adjustment outlet
 * 845 px di wadah 600 px (768 px layar), Pelanggan 590 di 584 sebelum kolom
 * namanya dibungkus.
 */
describe("tabelMeluber", () => {
  it("tabel lebih lebar dari wadah menjadi kartu", () => {
    expect(tabelMeluber(845, 600)).toBe(true);
    expect(tabelMeluber(590, 584)).toBe(true);
  });

  it("tabel yang muat atau selisih pembulatan 1 px tetap tabel", () => {
    expect(tabelMeluber(584, 584)).toBe(false);
    expect(tabelMeluber(585, 584)).toBe(false);
    expect(tabelMeluber(400, 600)).toBe(false);
  });
});

describe("bolehKembaliTabel", () => {
  it("kembali ke tabel hanya bila wadah selebar lebar alami terakhir", () => {
    expect(bolehKembaliTabel(845, 844)).toBe(false);
    expect(bolehKembaliTabel(845, 845)).toBe(true);
    expect(bolehKembaliTabel(845, 1100)).toBe(true);
  });

  it("tanpa lebar alami terukur tetap kartu", () => {
    expect(bolehKembaliTabel(null, 2000)).toBe(false);
  });
});
