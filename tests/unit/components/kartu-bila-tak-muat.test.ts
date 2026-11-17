import { describe, expect, it } from "vitest";
import { bolehKembaliTabel, kunciUkurUlang, tabelMeluber } from "@/components/ui/use-kartu-bila-tak-muat";

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

describe("kunciUkurUlang", () => {
  const dasar = { halaman: 1, ukuran: 10, memuat: false, kolom: 5 };

  it("pencarian dengan jumlah baris sama tetapi baris berbeda mengubah kunci", () => {
    const sebelum = kunciUkurUlang({ ...dasar, idBaris: ["a", "b", "c"] });
    const sesudah = kunciUkurUlang({ ...dasar, idBaris: ["x", "y", "z"] });
    expect(sesudah).not.toBe(sebelum);
  });

  it("baris yang sama memberi kunci yang sama, sehingga tidak mengukur ulang tanpa henti", () => {
    expect(kunciUkurUlang({ ...dasar, idBaris: ["a", "b"] })).toBe(kunciUkurUlang({ ...dasar, idBaris: ["a", "b"] }));
  });

  it("daftar kosong, halaman, dan status muat ikut membedakan kunci", () => {
    expect(kunciUkurUlang({ ...dasar, idBaris: [] })).toBe("0:-:1:10:false:5");
    expect(kunciUkurUlang({ ...dasar, idBaris: ["a"], halaman: 2 })).not.toBe(kunciUkurUlang({ ...dasar, idBaris: ["a"] }));
    expect(kunciUkurUlang({ ...dasar, idBaris: ["a"], memuat: true })).not.toBe(kunciUkurUlang({ ...dasar, idBaris: ["a"] }));
  });
});
