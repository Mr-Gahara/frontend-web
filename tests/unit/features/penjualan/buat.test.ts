import { describe, expect, it } from "vitest";
import { susunPayloadPenjualan, validasiPenjualan, type IsianPenjualan } from "@/features/penjualan/payload";
import { diskonAktif } from "@/features/diskon/filter";
import { pajakTransaksiAktif } from "@/features/pajak/filter";
import type { Diskon } from "@/types/diskon";
import type { Pajak } from "@/types/pajak";

const isianDasar: IsianPenjualan = {
  pelangganID: "c1",
  jenisPenjualan: "dine-in",
  tanggal: new Date(2026, 8, 24, 0, 0, 0, 0),
  waktu: { jam: "14", menit: "05" },
  items: [{ produkID: "p1", jumlah: 2, diskonItemIDs: [] }],
  diskonGlobalIDs: [],
  keterangan: "",
  locationID: undefined,
};

function diskon(id: string, status: Diskon["status"], cakupan: Diskon["cakupan"]): Diskon {
  return {
    id,
    namaDiskon: "D" + id,
    cakupan,
    tipe: "persen",
    nilai: 10,
    bisaDigabung: false,
    status,
    tenantID: "t",
    createdAt: "",
    updatedAt: "",
  };
}

function pajak(id: string, statusPajak: boolean, tipePajak: boolean, prioritas: number): Pajak {
  return {
    id,
    namaPajak: "P" + id,
    tarifPajak: 10,
    tipePajak,
    modelPerhitungan: 2,
    prioritas,
    statusPajak,
    tenantID: "t",
    createdAt: "",
    updatedAt: "",
  };
}

describe("validasiPenjualan", () => {
  it("memeriksa pelanggan lalu produk tiap baris, dengan pesan halaman lama", () => {
    expect(validasiPenjualan({ ...isianDasar, pelangganID: "" })).toBe(
      "Silakan pilih pelanggan terlebih dahulu.",
    );
    expect(
      validasiPenjualan({ ...isianDasar, items: [{ produkID: "", jumlah: 1, diskonItemIDs: [] }] }),
    ).toBe("Semua baris item harus memiliki produk.");
    expect(validasiPenjualan(isianDasar)).toBeNull();
  });

  it("menolak jam transaksi yang kosong atau di luar batas (keputusan K-TW5a)", () => {
    const pesan = "Jam transaksi wajib diisi lengkap.";
    expect(validasiPenjualan({ ...isianDasar, waktu: { jam: "", menit: "05" } })).toBe(pesan);
    expect(validasiPenjualan({ ...isianDasar, waktu: { jam: "14", menit: "" } })).toBe(pesan);
    expect(validasiPenjualan({ ...isianDasar, waktu: { jam: "99", menit: "05" } })).toBe(pesan);
    expect(validasiPenjualan({ ...isianDasar, waktu: { jam: "ab", menit: "05" } })).toBe(pesan);
  });
});

describe("susunPayloadPenjualan", () => {
  it("tidak menyusun payload dari jam yang tidak sah, alih-alih menggeser tanggal", () => {
    expect(() => susunPayloadPenjualan({ ...isianDasar, waktu: { jam: "99", menit: "05" } })).toThrow(
      "Jam transaksi tidak lengkap.",
    );
  });

  it("payload minimal: invoice DRAFT tanpa field kosong, tanpa locationID bila tidak ada", () => {
    expect(susunPayloadPenjualan(isianDasar)).toEqual({
      pelangganID: "c1",
      jenisTransaksi: "INVOICE",
      jenisPenjualan: "dine-in",
      tanggalTransaksi: new Date(2026, 8, 24, 14, 5, 0, 0).toISOString(),
      itemPenjualan: [{ produkID: "p1", jumlah: 2 }],
      simpanDraft: true,
    });
  });

  it("membawa diskon dengan nama field backend (diskonItem, diskonGlobal), keterangan, dan locationID (K13a)", () => {
    const payload = susunPayloadPenjualan({
      ...isianDasar,
      items: [{ produkID: "p1", jumlah: 2, diskonItemIDs: ["d1"] }],
      diskonGlobalIDs: ["d2"],
      keterangan: "Meja 4",
      locationID: "outlet-a",
    });
    expect(payload.itemPenjualan).toEqual([{ produkID: "p1", jumlah: 2, diskonItem: ["d1"] }]);
    expect(payload.diskonGlobal).toEqual(["d2"]);
    expect(payload).not.toHaveProperty("diskonGlobalIDs");
    expect(payload.keterangan).toBe("Meja 4");
    expect(payload.locationID).toBe("outlet-a");
    expect(payload).not.toHaveProperty("status");
  });
});

describe("penyaring referensi buat penjualan", () => {
  it("diskonAktif hanya diskon Aktif pada cakupan yang diminta", () => {
    const daftar = [diskon("1", "Aktif", "Item"), diskon("2", "Non-Aktif", "Item"), diskon("3", "Aktif", "Global")];
    expect(diskonAktif(daftar, "Item").map((d) => d.id)).toEqual(["1"]);
    expect(diskonAktif(daftar, "Global").map((d) => d.id)).toEqual(["3"]);
  });

  it("pajakTransaksiAktif hanya pajak per transaksi yang aktif, urut prioritas, tanpa mengubah daftar asal", () => {
    const daftar = [pajak("a", true, false, 2), pajak("b", true, true, 1), pajak("c", false, false, 0), pajak("d", true, false, 1)];
    expect(pajakTransaksiAktif(daftar).map((p) => p.id)).toEqual(["d", "a"]);
    expect(daftar.map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });
});