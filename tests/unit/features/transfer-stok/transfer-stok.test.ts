import { describe, expect, it } from "vitest";
import { filterServerTransfer, saringTransfer } from "@/features/transfer-stok/filter";
import { aksiSuratJalan } from "@/features/transfer-stok/izin";
import { susunPayloadRevisi } from "@/features/transfer-stok/payload";
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

const nomor = (hasil: TransferStok[]) => hasil.map((t) => t.nomorTransfer);

describe("saringTransfer", () => {
  it("menyaring status di klien karena backend mengabaikan query", () => {
    expect(nomor(saringTransfer(daftar, { status: "DIKIRIM" }))).toEqual(["SJ-2", "SJ-3"]);
    expect(nomor(saringTransfer(daftar, { status: "ALL" }))).toEqual(["SJ-1", "SJ-2", "SJ-3", "SJ-4"]);
  });

  it("menyaring lokasi tujuan per lokasi atau per tipe", () => {
    expect(nomor(saringTransfer(daftar, { status: "DIKIRIM", tujuan: { lokasiID: "o2" } }))).toEqual(["SJ-3"]);
    expect(nomor(saringTransfer(daftar, { tujuan: { tipeLokasi: "Gudang" } }))).toEqual([]);
  });

  it("mencari nomor dan nama lokasi tujuan, atau asal bila diminta", () => {
    expect(nomor(saringTransfer(daftar, { cari: "outlet b" }))).toEqual(["SJ-3", "SJ-4"]);
    expect(nomor(saringTransfer(daftar, { cari: "timur", cariPada: "asal" }))).toEqual(["SJ-3"]);
    expect(nomor(saringTransfer(daftar, { cari: " sj-2 " }))).toEqual(["SJ-2"]);
  });
});

describe("filterServerTransfer", () => {
  it("mengirim status dan lokasi tujuan tunggal, bukan ALL maupun tipe lokasi", () => {
    expect(filterServerTransfer({ status: "ALL" })).toEqual({});
    expect(filterServerTransfer({ status: "DIKIRIM", tujuan: { lokasiID: "o1" } })).toEqual({
      status: "DIKIRIM",
      locationID: "o1",
    });
    expect(filterServerTransfer({ tujuan: { tipeLokasi: "Outlet" } })).toEqual({});
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