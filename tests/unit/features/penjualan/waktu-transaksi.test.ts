import { describe, expect, it } from "vitest";
import { susunPayloadPenjualan, waktuTransaksi } from "@/features/penjualan/payload";

const isianDasar = {
  pelangganID: "p1",
  jenisPenjualan: "dine-in" as const,
  items: [{ produkID: "pr1", jumlah: 1, diskonItemIDs: [] }],
  diskonGlobalIDs: [],
  keterangan: "",
  locationID: undefined,
};

describe("waktuTransaksi", () => {
  it("belum diubah kasir: mengikuti sekarang", () => {
    const sekarang = new Date(2026, 9, 26, 0, 5, 42);
    expect(waktuTransaksi(null, sekarang)).toEqual({ tanggal: sekarang, waktu: { jam: "00", menit: "05" } });
  });

  it("sudah diubah kasir: nilai kasir dipakai apa adanya", () => {
    const dipilih = { tanggal: new Date(2026, 9, 25), waktu: { jam: "21", menit: "15" } };
    expect(waktuTransaksi(dipilih, new Date(2026, 9, 26, 0, 5))).toBe(dipilih);
  });

  it("form dibuka 23:58 dan disimpan 00:05 tanpa diubah: payload memakai waktu simpan, bukan hari kemarin", () => {
    const simpan = new Date(2026, 9, 26, 0, 5, 42);
    const payload = susunPayloadPenjualan({ ...isianDasar, ...waktuTransaksi(null, simpan) });
    expect(payload.tanggalTransaksi).toBe(new Date(2026, 9, 26, 0, 5, 0).toISOString());
  });
});