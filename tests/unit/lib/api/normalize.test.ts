import { describe, expect, it } from "vitest";
import { normalizeId, unwrap } from "@/lib/api/normalize";
import { ApiError } from "@/lib/api/error";

describe("normalizeId", () => {
  it("mengubah _id menjadi id dan membuang __v", () => {
    expect(normalizeId({ _id: "a1", __v: 0, namaKategori: "Kopi" })).toEqual({
      id: "a1",
      namaKategori: "Kopi",
    });
  });

  it("menormalkan objek bertingkat, seperti dataPelanggan pada penjualan", () => {
    const hasil = normalizeId({
      id: "p1",
      dataPelanggan: { _id: "c1", namaPelanggan: "Budi" },
    });
    expect(hasil).toEqual({ id: "p1", dataPelanggan: { id: "c1", namaPelanggan: "Budi" } });
  });

  it("menormalkan array dan isi array bertingkat", () => {
    expect(normalizeId([{ _id: "x" }, { _id: "y", items: [{ _id: "z" }] }])).toEqual([
      { id: "x" },
      { id: "y", items: [{ id: "z" }] },
    ]);
  });

  it("mempertahankan id bila objek memiliki id dan _id sekaligus", () => {
    expect(normalizeId({ id: "asli", _id: "lama" })).toEqual({ id: "asli" });
  });

  it("membiarkan nilai null dan primitif apa adanya", () => {
    expect(normalizeId({ disetujuiOleh: null, stok: 0, aktif: false })).toEqual({
      disetujuiOleh: null,
      stok: 0,
      aktif: false,
    });
  });
});

describe("unwrap", () => {
  it("mengambil data dari envelope { data }", () => {
    expect(unwrap<{ id: string }[]>({ data: [{ _id: "a" }] }).data).toEqual([{ id: "a" }]);
  });

  it("membaca jumlah dari count", () => {
    expect(unwrap({ success: true, count: 9, data: [] }).jumlah).toBe(9);
  });

  it("membaca jumlah dari total", () => {
    expect(unwrap({ message: "ok", total: 21, data: [] }).jumlah).toBe(21);
  });

  it("jumlah undefined bila backend tidak mengirim count maupun total", () => {
    expect(unwrap({ data: [] }).jumlah).toBeUndefined();
  });

  it("melempar ApiError saat success false walau status 200", () => {
    expect(() =>
      unwrap({ success: false, code: "DEVICE_PENDING_APPROVAL", message: "Menunggu persetujuan." }),
    ).toThrow(ApiError);
  });

  it("membawa code pada ApiError dari success false", () => {
    try {
      unwrap({ success: false, code: "DEVICE_PENDING_APPROVAL", message: "Menunggu." });
    } catch (e) {
      expect((e as ApiError).code).toBe("DEVICE_PENDING_APPROVAL");
      expect((e as ApiError).status).toBe(200);
    }
  });
});