import { describe, expect, it } from "vitest";
import { susunPayloadBooking } from "@/features/sesi-booking/payload";
import { skemaBooking, type NilaiFormBooking } from "@/features/sesi-booking/schema";
import { isianWaktuItem, rentangWaktuItem, waktuItemDari } from "@/features/sesi-booking/waktu-booking";

const tanggal = new Date(2026, 9, 10, 15, 42, 30);

describe("waktu per fasilitas", () => {
  it("waktu awal mengambil jam dan menit saat ini dengan durasi 1 jam", () => {
    const w = waktuItemDari(tanggal);
    expect(w.waktu).toEqual({ jam: "15", menit: "42" });
    expect(w.durasi).toBe(1);
  });

  it("rentang dihitung dari tanggal, jam mulai, dan durasi, dengan detik 0", () => {
    const r = rentangWaktuItem({ tanggal, waktu: { jam: "08", menit: "30" }, durasi: 2 });
    expect(r?.mulai.getTime()).toBe(new Date(2026, 9, 10, 8, 30, 0, 0).getTime());
    expect(r?.selesai.getTime()).toBe(new Date(2026, 9, 10, 10, 30, 0, 0).getTime());
  });

  it("jam yang belum lengkap tidak menghasilkan rentang maupun isian form (K-TW5a)", () => {
    const w = { tanggal, waktu: { jam: "", menit: "30" }, durasi: 1 };
    expect(rentangWaktuItem(w)).toBeNull();
    expect(isianWaktuItem(w)).toEqual({ waktuMulai: "", waktuSelesai: "" });
  });
});

describe("skemaBooking", () => {
  const sah: NilaiFormBooking = {
    dataPelanggan: "p1",
    items: [{ dataAset: "a1", ...isianWaktuItem(waktuItemDari(tanggal)), diskonItem: [] }],
  };

  it("menerima isian sah", () => {
    expect(skemaBooking.safeParse(sah).success).toBe(true);
  });

  it("menolak waktu mulai kosong dengan pesan yang sama dengan halaman lama", () => {
    const hasil = skemaBooking.safeParse({ ...sah, items: [{ ...sah.items[0], waktuMulai: "", waktuSelesai: "" }] });
    expect(hasil.success).toBe(false);
    const pesan = hasil.success ? [] : hasil.error.issues.map((i) => i.message);
    expect(pesan).toContain("Waktu mulai wajib diisi");
  });

  it("menolak pelanggan dan aset kosong", () => {
    const hasil = skemaBooking.safeParse({ dataPelanggan: "", items: [{ ...sah.items[0], dataAset: "" }] });
    const pesan = hasil.success ? [] : hasil.error.issues.map((i) => i.message);
    expect(pesan).toEqual(expect.arrayContaining(["Pelanggan wajib dipilih", "Aset wajib dipilih"]));
  });
});

describe("susunPayloadBooking", () => {
  const nilai: NilaiFormBooking = {
    dataPelanggan: "p1",
    items: [
      {
        dataAset: "a1",
        waktuMulai: new Date(2026, 9, 10, 8, 0).toISOString(),
        waktuSelesai: new Date(2026, 9, 10, 10, 0).toISOString(),
        diskonItem: [],
      },
    ],
  };

  it("tidak mengirim diskon yang tidak dipilih", () => {
    const payload = susunPayloadBooking(nilai, []);
    expect(payload.diskonGlobal).toBeUndefined();
    expect(payload.items[0].diskonItem).toBeUndefined();
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      dataPelanggan: "p1",
      items: [{ dataAset: "a1", waktuMulai: nilai.items[0].waktuMulai, waktuSelesai: nilai.items[0].waktuSelesai }],
    });
  });

  it("mengirim diskon global dan diskon item yang dipilih", () => {
    const payload = susunPayloadBooking({ ...nilai, items: [{ ...nilai.items[0], diskonItem: ["d1"] }] }, ["g1"]);
    expect(payload.diskonGlobal).toEqual(["g1"]);
    expect(payload.items[0].diskonItem).toEqual(["d1"]);
  });
});