import { describe, expect, it } from "vitest";
import { emptyItem, hitungSimulasi, type MasukanSimulasi } from "@/features/penjualan/simulasi";
import type { Diskon } from "@/types/diskon";
import type { Pajak } from "@/types/pajak";
import type { Produk } from "@/types/produk";

const produk = (id: string, hargaJual: number) => ({ id, namaProduk: id, hargaJual }) as Produk;
const diskon = (id: string, tipe: "persen" | "nominal", nilai: number) => ({ id, namaDiskon: id, tipe, nilai }) as Diskon;
const pajak = (namaPajak: string, modelPerhitungan: number, tarifPajak: number) =>
  ({ id: namaPajak, namaPajak, modelPerhitungan, tarifPajak }) as Pajak;

const masukan = (ubah: Partial<MasukanSimulasi> = {}): MasukanSimulasi => ({
  items: [{ ...emptyItem(), produkID: "kopi", jumlah: 2, jumlahStr: "2", diskonItemIDs: ["d10"] }],
  produkList: [produk("kopi", 10_000)],
  activeDiskonItem: [diskon("d10", "persen", 10)],
  activeDiskonGlobal: [diskon("g3k", "nominal", 3_000)],
  diskonGlobalIDs: ["g3k"],
  activePajakGlobal: [],
  ...ubah,
});

describe("hitungSimulasi (dipindah dari halaman buat penjualan)", () => {
  it("diskon item lalu diskon global", () => {
    const h = hitungSimulasi(masukan());
    expect(h.itemsCalc).toEqual([{ subTotal: 20_000, totalDiskonItem: 2_000, totalHarga: 18_000 }]);
    expect(h.grandTotalItem).toBe(18_000);
    expect(h.totalDiskonGlobal).toBe(3_000);
    expect(h.grandTotal).toBe(15_000);
  });

  it("pajak exclusive menambah total, inclusive hanya dicatat", () => {
    const h = hitungSimulasi(masukan({ activePajakGlobal: [pajak("PB1", 2, 10), pajak("PPN", 1, 11)] }));
    expect(h.rincianPajak).toEqual([
      { namaPajak: "PB1", nominal: 1_500, tipe: "Exc" },
      { namaPajak: "PPN", nominal: Math.round((16_500 / 1.11) * 0.11), tipe: "Inc" },
    ]);
    expect(h.grandTotal).toBe(16_500);
  });

  it("pajak berantai (model 3) dihitung dari total berjalan", () => {
    const h = hitungSimulasi(masukan({ activePajakGlobal: [pajak("A", 2, 10), pajak("B", 3, 10)] }));
    expect(h.totalPajak).toBe(1_500 + 1_650);
    expect(h.grandTotal).toBe(18_150);
  });

  it("potongan tidak melebihi harga, dan diskon yang tidak dipilih diabaikan", () => {
    const h = hitungSimulasi(
      masukan({ activeDiskonItem: [diskon("d10", "nominal", 50_000)], diskonGlobalIDs: [] }),
    );
    expect(h.itemsCalc[0]).toEqual({ subTotal: 20_000, totalDiskonItem: 20_000, totalHarga: 0 });
    expect(h.totalDiskonGlobal).toBe(0);
    expect(h.grandTotal).toBe(0);
  });

  it("item tanpa produk bernilai 0, jumlah 0 dibaca 1", () => {
    const h = hitungSimulasi(
      masukan({ items: [emptyItem(), { ...emptyItem(), produkID: "kopi", jumlah: 0, jumlahStr: "" }], diskonGlobalIDs: [] }),
    );
    expect(h.itemsCalc.map((i) => i.totalHarga)).toEqual([0, 10_000]);
  });
});
