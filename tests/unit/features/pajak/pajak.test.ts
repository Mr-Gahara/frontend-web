import { describe, expect, it } from "vitest";
import { skemaPajak, type NilaiPajak } from "@/features/pajak/schema";
import { NILAI_AWAL_PAJAK, nilaiAwalPajak, payloadBuatPajak, payloadUbahPajak } from "@/features/pajak/payload";
import {
  labelModelRelasi,
  pajakTerpasang,
  pajakTransaksiTerdampak,
  pilihanPajakProduk,
} from "@/features/pajak/tampilan";
import type { Pajak, RelasiPajakProduk } from "@/types/pajak";

const pajak = (id: string, ubah: Partial<Pajak> = {}): Pajak => ({
  id,
  namaPajak: "Pajak " + id,
  tarifPajak: 10,
  tipePajak: true,
  modelPerhitungan: 2,
  prioritas: 1,
  statusPajak: true,
  tenantID: "t",
  createdAt: "",
  updatedAt: "",
  ...ubah,
});

const isian = (ubah: Partial<NilaiPajak> = {}): NilaiPajak => ({
  ...NILAI_AWAL_PAJAK,
  namaPajak: "PPN",
  tarifPajak: "10",
  ...ubah,
});

const pesan = (n: NilaiPajak) => skemaPajak.safeParse(n).error?.issues.map((i) => i.message) ?? [];

const relasi = (id: string, model: RelasiPajakProduk["pajak"]["model"] = "Exclusive"): RelasiPajakProduk => ({
  id,
  produkID: "p1",
  pajak: { id: "pj-" + id, nama: "Pajak " + id, tarif: 5, tipe: true, prioritas: 1, model },
});

describe("skemaPajak", () => {
  it("menerima isian sah dan memangkas nama", () => {
    const hasil = skemaPajak.safeParse(isian({ namaPajak: "  PB1  " }));
    expect(hasil.success).toBe(true);
    expect(hasil.data?.namaPajak).toBe("PB1");
  });

  it("menolak nama berisi spasi saja", () => {
    expect(pesan(isian({ namaPajak: "   " }))).toEqual(["Nama Pajak wajib diisi."]);
  });

  it("menolak tarif kosong, tetapi menerima 0 yang diketik (T3b)", () => {
    expect(pesan(isian({ tarifPajak: "" }))).toEqual(["Tarif wajib diisi."]);
    expect(pesan(isian({ tarifPajak: "  " }))).toEqual(["Tarif wajib diisi."]);
    expect(pesan(isian({ tarifPajak: "0" }))).toEqual([]);
  });

  it("menolak tarif di luar 0 sampai 100 dan yang bukan angka, menerima desimal dan batasnya", () => {
    expect(pesan(isian({ tarifPajak: "101" }))).toEqual(["Tarif harus antara 0 sampai 100."]);
    expect(pesan(isian({ tarifPajak: "-1" }))).toEqual(["Tarif harus antara 0 sampai 100."]);
    expect(pesan(isian({ tarifPajak: "abc" }))).toEqual(["Tarif harus berupa angka."]);
    expect(pesan(isian({ tarifPajak: "100" }))).toEqual([]);
    expect(pesan(isian({ tarifPajak: "12.5" }))).toEqual([]);
  });

  it("menolak prioritas selain 1 atau 2 (PO8a)", () => {
    expect(pesan(isian({ prioritas: "" }))).toEqual(["Prioritas wajib dipilih."]);
    expect(pesan(isian({ prioritas: "3" }))).toEqual(["Prioritas wajib dipilih."]);
    expect(pesan(isian({ prioritas: "2" }))).toEqual([]);
  });
});

describe("payload pajak", () => {
  it("nilai awal buat sama dengan halaman lama: per produk, Add-on, prioritas 1, aktif", () => {
    expect(NILAI_AWAL_PAJAK).toEqual({
      namaPajak: "",
      tarifPajak: "",
      tipePajak: true,
      modelPerhitungan: "2",
      prioritas: "1",
      statusPajak: true,
    });
  });

  it("payload buat memangkas nama dan mengubah tarif, model, serta prioritas menjadi angka", () => {
    expect(payloadBuatPajak(isian({ namaPajak: " PB1 ", tarifPajak: "12.5", modelPerhitungan: "1", prioritas: "2" }))).toEqual({
      namaPajak: "PB1",
      tarifPajak: 12.5,
      tipePajak: true,
      modelPerhitungan: 1,
      prioritas: 2,
      statusPajak: true,
    });
  });

  it("nilai awal ubah mengubah angka menjadi teks dan mengosongkan prioritas di luar 1 atau 2", () => {
    expect(nilaiAwalPajak(pajak("a", { tarifPajak: 11, modelPerhitungan: 3, prioritas: 2, statusPajak: false }))).toEqual({
      namaPajak: "Pajak a",
      tarifPajak: "11",
      tipePajak: true,
      modelPerhitungan: "3",
      prioritas: "2",
      statusPajak: false,
    });
    expect(nilaiAwalPajak(pajak("a", { prioritas: 5 })).prioritas).toBe("");
  });

  it("payload ubah hanya mengirim field yang berubah, dengan tipePajak selalu ikut", () => {
    const asal = pajak("a", { namaPajak: "PPN", tipePajak: false });
    expect(payloadUbahPajak(nilaiAwalPajak(asal), asal)).toEqual({ tipePajak: false });
    expect(payloadUbahPajak({ ...nilaiAwalPajak(asal), namaPajak: " PPN " }, asal)).toEqual({ tipePajak: false });
    expect(payloadUbahPajak({ ...nilaiAwalPajak(asal), tarifPajak: "11", statusPajak: false }, asal)).toEqual({
      tipePajak: false,
      tarifPajak: 11,
      statusPajak: false,
    });
    expect(payloadUbahPajak({ ...nilaiAwalPajak(asal), tipePajak: true, prioritas: "2", modelPerhitungan: "1" }, asal)).toEqual({
      tipePajak: true,
      prioritas: 2,
      modelPerhitungan: 1,
    });
  });
});

describe("tampilan pajak", () => {
  it("label model relasi disamakan dengan tabel daftar", () => {
    expect(labelModelRelasi("Inclusive")).toBe("Inklusif");
    expect(labelModelRelasi("Exclusive")).toBe("Add-on (Eksklusif)");
    expect(labelModelRelasi("Compound")).toBe("Compound");
  });

  it("pajak terpasang adalah relasi pertama, atau null bila belum ada", () => {
    expect(pajakTerpasang([])).toBeNull();
    expect(pajakTerpasang([relasi("r1")])?.id).toBe("r1");
  });

  it("pilihan pasang hanya pajak per produk yang aktif, selain yang terpasang (PO6a)", () => {
    const daftar = [
      pajak("a"),
      pajak("b", { statusPajak: false }),
      pajak("c", { tipePajak: false }),
      pajak("d"),
    ];
    expect(pilihanPajakProduk(daftar).map((p) => p.id)).toEqual(["a", "d"]);
    expect(pilihanPajakProduk(daftar, "a").map((p) => p.id)).toEqual(["d"]);
  });

  it("pajak per transaksi terdampak hanya bila isian per transaksi dan aktif, tanpa dirinya sendiri (PO7a)", () => {
    const daftar = [
      pajak("ppn", { tipePajak: false }),
      pajak("lama", { tipePajak: false, statusPajak: false }),
      pajak("produk"),
    ];
    expect(pajakTransaksiTerdampak(daftar, { tipePajak: false, statusPajak: true }).map((p) => p.id)).toEqual(["ppn"]);
    expect(pajakTransaksiTerdampak(daftar, { tipePajak: false, statusPajak: true }, "ppn")).toEqual([]);
    expect(pajakTransaksiTerdampak(daftar, { tipePajak: false, statusPajak: false })).toEqual([]);
    expect(pajakTransaksiTerdampak(daftar, { tipePajak: true, statusPajak: true })).toEqual([]);
  });
});