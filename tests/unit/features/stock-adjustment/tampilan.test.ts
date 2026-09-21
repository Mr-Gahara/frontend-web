import { describe, expect, it } from "vitest";
import type { StockAdjustmentItem } from "@/types/stockOpname";
import {
  formatKoreksi,
  formatTanggalAdjustment,
  susunBarisItem,
  susunSumber,
} from "@/features/stock-adjustment/tampilan";

const itemDasar: StockAdjustmentItem = {
  itemId: "i1",
  bahanBakuID: "b1",
  barangInventoryID: null,
  namaSnapshot: "susu full cream",
  satuanSnapshot: "ml",
  qtySnapshot: 30000,
  qtyCurrent: 30000,
  qtyPhysical: 35000,
  qtyDifference: 5000,
};

describe("susunBarisItem", () => {
  it("memakai saldo saat disetujui dan koreksi dari server", () => {
    const baris = susunBarisItem(itemDasar);
    expect(baris.qtySistem).toBe(30000);
    expect(baris.qtyFisik).toBe(35000);
    expect(baris.qtyKoreksi).toBe(5000);
    expect(baris.arah).toBe("tambah");
  });

  it("menampilkan stok saat draf hanya bila berbeda dari saldo saat disetujui", () => {
    expect(susunBarisItem(itemDasar).qtySaatDraf).toBeNull();
    expect(susunBarisItem({ ...itemDasar, qtySnapshot: 28000 }).qtySaatDraf).toBe(28000);
  });

  it("menentukan arah kurang dan tetap", () => {
    expect(susunBarisItem({ ...itemDasar, qtyDifference: -3 }).arah).toBe("kurang");
    expect(susunBarisItem({ ...itemDasar, qtyDifference: 0 }).arah).toBe("tetap");
  });

  it("mengganti nama dan satuan kosong dengan tanda strip", () => {
    const baris = susunBarisItem({ ...itemDasar, namaSnapshot: null, satuanSnapshot: null });
    expect(baris.nama).toBe("-");
    expect(baris.satuan).toBe("-");
  });
});

describe("susunSumber", () => {
  const lokasiOutlet = { id: "l1", nama: "Outlet A", tipe: "Outlet" };

  const opname = { id: "op1", nomorOpname: "SO-001", tanggal: null };

  it("menautkan dokumen opname di ruang outlet untuk lokasi outlet", () => {
    expect(
      susunSumber({ referenceType: "STOCK_OPNAME", referenceID: opname, lokasi: lokasiOutlet }),
    ).toEqual({
      label: "Stock Opname SO-001",
      href: "/dashboard/outlet/inventaris/stockOpname/op1",
    });
  });

  it("menautkan dokumen opname di ruang gudang untuk lokasi gudang", () => {
    const lokasiGudang = { ...lokasiOutlet, tipe: "Gudang" };
    expect(
      susunSumber({ referenceType: "STOCK_OPNAME", referenceID: opname, lokasi: lokasiGudang }).href,
    ).toBe("/dashboard/gudang/stockOpname/op1");
  });

  it("tidak menautkan opname yang dokumennya sudah tidak ada", () => {
    expect(
      susunSumber({ referenceType: "STOCK_OPNAME", referenceID: null, lokasi: lokasiOutlet }),
    ).toEqual({ label: "Stock Opname", href: null });
  });

  it("tidak menautkan koreksi manual dan sumber yang tidak dikirim", () => {
    expect(
      susunSumber({ referenceType: "MANUAL_CORRECTION", referenceID: null, lokasi: lokasiOutlet }),
    ).toEqual({ label: "Koreksi Manual", href: null });
    expect(susunSumber({ referenceType: null, referenceID: null, lokasi: null })).toEqual({
      label: "-",
      href: null,
    });
  });
});

describe("formatKoreksi", () => {
  it("memberi tanda plus untuk koreksi positif", () => {
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
