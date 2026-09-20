import { describe, expect, it } from "vitest";
import type { StockAdjustmentItem } from "@/types/stockOpname";
import {
  formatKoreksi,
  formatTanggalAdjustment,
  susunBarisItem,
} from "@/features/stock-adjustment/tampilan";

const itemDasar: StockAdjustmentItem = {
  itemId: "i1",
  bahanBakuID: "b1",
  barangInventoryID: null,
  namaSnapshot: "susu full cream",
  satuanSnapshot: "ml",
  qtySebelum: 0,
  qtyPhysical: 35000,
  qtyAdjustment: 0,
  catatanItem: null,
};

describe("susunBarisItem", () => {
  it("menyembunyikan saldo sistem dan koreksi selama mapper backend belum benar", () => {
    const baris = susunBarisItem(itemDasar, false);
    expect(baris.qtySistem).toBeNull();
    expect(baris.qtyKoreksi).toBeNull();
    expect(baris.arah).toBeNull();
    expect(baris.qtyFisik).toBe(35000);
  });

  it("memakai nilai server setelah mapper benar", () => {
    const baris = susunBarisItem(
      { ...itemDasar, qtySebelum: 10, qtyPhysical: 15, qtyAdjustment: 5 },
      true,
    );
    expect(baris.qtySistem).toBe(10);
    expect(baris.qtyKoreksi).toBe(5);
    expect(baris.arah).toBe("tambah");
  });

  it("menentukan arah kurang dan tetap", () => {
    expect(susunBarisItem({ ...itemDasar, qtyAdjustment: -3 }, true).arah).toBe("kurang");
    expect(susunBarisItem({ ...itemDasar, qtyAdjustment: 0 }, true).arah).toBe("tetap");
  });

  it("mengganti nama, satuan, dan catatan kosong dengan tanda strip", () => {
    const baris = susunBarisItem(
      { ...itemDasar, namaSnapshot: null, satuanSnapshot: null, catatanItem: null },
      false,
    );
    expect(baris.nama).toBe("-");
    expect(baris.satuan).toBe("-");
    expect(baris.catatan).toBe("-");
  });
});

describe("formatKoreksi", () => {
  it("memberi tanda plus untuk koreksi positif dan strip untuk nilai kosong", () => {
    expect(formatKoreksi(null)).toBe("-");
    expect(formatKoreksi(5)).toBe("+5");
    expect(formatKoreksi(-3)).toBe("-3");
    expect(formatKoreksi(0)).toBe("0");
  });
});

describe("formatTanggalAdjustment", () => {
  it("menampilkan strip untuk tanggal kosong dan format Indonesia untuk tanggal terisi", () => {
    expect(formatTanggalAdjustment(null)).toBe("-");
    expect(formatTanggalAdjustment(undefined)).toBe("-");
    expect(formatTanggalAdjustment("2026-08-07T12:39:17.617Z")).toMatch(
      /^07 \S+ 2026, \d{2}:\d{2}$/,
    );
  });
});