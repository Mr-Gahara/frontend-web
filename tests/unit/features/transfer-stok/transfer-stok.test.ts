import { describe, expect, it } from "vitest";
import { paramHalamanPemantauan } from "@/features/transfer-stok/filter";
import { RUANG_SURAT_JALAN, ruangPenerima, ruangPengirim } from "@/features/transfer-stok/ruang";
import { aksiSuratJalan } from "@/features/transfer-stok/izin";
import { susunPayloadRevisi } from "@/features/transfer-stok/payload";
import { LABEL_STATUS_TRANSFER, LABEL_TAB_TRANSFER, SLUG_TAB_TRANSFER, TAB_TRANSFER } from "@/features/transfer-stok/tampilan";
import type { StatusTransfer, TransferStok } from "@/types/transferStok";

const lokasi = (id: string, nama: string, tipe: string) => ({ id, nama, tipe });

const transfer = (nomor: string, status: StatusTransfer, ke: string, dari = "Gudang A"): TransferStok => ({
  id: nomor,
  tenantID: null,
  nomorTransfer: nomor,
  status,
  dariLokasi: lokasi("g1", dari, "Gudang"),
  keLokasi: lokasi(ke === "Outlet B" ? "o2" : "o1", ke, "Outlet"),
  pengirim: null,
  penerima: null,
  pengajuanStokID: null,
  items: [],
  tanggalKirim: null,
  tanggalTerima: null,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const daftar = [
  transfer("SJ-1", "PENDING", "Outlet A"),
  transfer("SJ-2", "DIKIRIM", "Outlet A"),
  transfer("SJ-3", "DIKIRIM", "Outlet B", "Gudang Timur"),
  transfer("SJ-4", "BATAL", "Outlet B"),
];

describe("paramHalamanPemantauan", () => {
  const dasar = { cari: "", halaman: 1, ukuran: 10 };

  it("selalu DIKIRIM dan berhalaman", () => {
    expect(paramHalamanPemantauan(dasar)).toEqual({ page: "1", limit: "10", status: "DIKIRIM" });
    expect(paramHalamanPemantauan({ ...dasar, halaman: 3, ukuran: 50 })).toMatchObject({ page: "3", limit: "50" });
  });

  it("lingkup satu lokasi menjadi dariLocationID atau keLocationID, tipe lokasi menjadi dariTipeLokasi atau keTipeLokasi", () => {
    expect(paramHalamanPemantauan({ ...dasar, tujuan: { lokasiID: "o1" } })).toMatchObject({ keLocationID: "o1" });
    expect(paramHalamanPemantauan({ ...dasar, tujuan: { tipeLokasi: "Outlet" } })).toMatchObject({ keTipeLokasi: "Outlet" });
    expect(paramHalamanPemantauan({ ...dasar, asal: { tipeLokasi: "Gudang" } })).toMatchObject({ dariTipeLokasi: "Gudang" });
    expect(paramHalamanPemantauan({ ...dasar, asal: { lokasiID: "g1" } })).toMatchObject({ dariLocationID: "g1" });
  });

  it("pencarian dipangkas dan dikirim ke server, kosong tidak dikirim", () => {
    expect(paramHalamanPemantauan({ ...dasar, cari: "  SJ-1 " })).toMatchObject({ cari: "SJ-1" });
    expect(paramHalamanPemantauan({ ...dasar, cari: "   " })).not.toHaveProperty("cari");
  });
});

describe("aksiSuratJalan", () => {
  const semua = ["approve-transfer-stok", "create-transfer-stok", "cancel-transfer-stok", "receive-transfer-stok"];

  it("PENDING menawarkan kirim, revisi, dan batal sesuai izin", () => {
    expect(aksiSuratJalan("PENDING", semua)).toEqual({ kirim: true, revisi: true, batal: true, terima: false });
    expect(aksiSuratJalan("PENDING", ["create-transfer-stok"])).toEqual({
      kirim: false,
      revisi: true,
      batal: false,
      terima: false,
    });
  });

  it("DIKIRIM hanya menawarkan terima, tanpa batal", () => {
    expect(aksiSuratJalan("DIKIRIM", semua)).toEqual({ kirim: false, revisi: false, batal: false, terima: true });
    expect(aksiSuratJalan("DIKIRIM", ["cancel-transfer-stok"]).terima).toBe(false);
  });

  it("DITERIMA dan BATAL tidak menawarkan aksi apa pun", () => {
    const kosong = { kirim: false, revisi: false, batal: false, terima: false };
    expect(aksiSuratJalan("DITERIMA", semua)).toEqual(kosong);
    expect(aksiSuratJalan("BATAL", semua)).toEqual(kosong);
  });
});

describe("susunPayloadRevisi", () => {
  it("hanya mengirim items dengan jumlah angka, dan membuang baris tanpa barang atau berjumlah 0", () => {
    const hasil = susunPayloadRevisi([
      { bahanBakuID: "a", qtyKirim: "150" },
      { bahanBakuID: "b", qtyKirim: "0" },
      { bahanBakuID: "", qtyKirim: "10" },
      { bahanBakuID: "c", qtyKirim: "abc" },
    ]);
    expect(hasil).toEqual({ ok: true, payload: { items: [{ bahanBakuID: "a", qtyKirim: 150 }] } });
  });

  it("menolak bila tidak ada satu pun baris valid", () => {
    const hasil = susunPayloadRevisi([{ bahanBakuID: "a", qtyKirim: "0" }]);
    expect(hasil.ok).toBe(false);
  });
});

describe("label status surat jalan", () => {
  it("setiap status berlabel bahasa awam, selaras dengan dashboard gudang", () => {
    expect(LABEL_STATUS_TRANSFER).toEqual({
      PENDING: "Belum Dikirim",
      DIKIRIM: "Dalam Perjalanan",
      DITERIMA: "Diterima",
      BATAL: "Dibatalkan",
    });
  });

  it("label tab memakai label status yang sama, ditambah Semua, sesuai urutan tab", () => {
    expect(TAB_TRANSFER.map((t) => LABEL_TAB_TRANSFER[t])).toEqual([
      "Semua",
      "Belum Dikirim",
      "Dalam Perjalanan",
      "Diterima",
      "Dibatalkan",
    ]);
    for (const status of ["PENDING", "DIKIRIM", "DITERIMA", "BATAL"] as const) {
      expect(LABEL_TAB_TRANSFER[status]).toBe(LABEL_STATUS_TRANSFER[status]);
    }
  });

  it("slug ?tab= tidak berubah walau label diganti", () => {
    expect(SLUG_TAB_TRANSFER).toEqual({ ALL: "semua", PENDING: "draf", DIKIRIM: "dikirim", DITERIMA: "selesai", BATAL: "dibatalkan" });
  });
});

describe("ruang surat jalan", () => {
  const kembali = { dariLokasi: lokasi("o1", "Outlet A", "Outlet"), keLokasi: lokasi("g1", "Gudang A", "Gudang") };

  it("pengirim adalah ruang asal, penerima ruang tujuan (P8, AR2a)", () => {
    expect(ruangPengirim("gudang", daftar[0])).toBe(true);
    expect(ruangPenerima("outlet", daftar[0])).toBe(true);
    expect(ruangPengirim("outlet", kembali)).toBe(true);
    expect(ruangPenerima("gudang", kembali)).toBe(true);
    expect(ruangPengirim("gudang", kembali)).toBe(false);
    expect(ruangPenerima("outlet", kembali)).toBe(false);
  });

  it("URL per ruang", () => {
    expect(RUANG_SURAT_JALAN.gudang.urlPenerimaan).toBe("/dashboard/gudang/penerimaanStok");
    expect(RUANG_SURAT_JALAN.outlet.urlSuratJalan).toBe("/dashboard/outlet/inventaris/pengirimanBarang");
  });
});
