import { describe, expect, it } from "vitest";
import { bookingPerAset, tautanPenjualanBooking } from "@/features/sesi-booking/tampilan";
import type { SesiBookingResponse } from "@/types/sesiBooking";

const awal = new Date("2026-09-27T08:00:00");
const akhir = new Date("2026-09-27T14:00:00");

function booking(ubah: Partial<SesiBookingResponse> = {}): SesiBookingResponse {
  return {
    id: "b1",
    tenantID: "t",
    dataPengguna: null,
    dataPelanggan: { id: "p1", namaPelanggan: "Uji", tipePelanggan: "umum" },
    dataAset: { id: "a1", namaAset: "Meja", status: "tersedia" },
    dataTarif: null,
    waktuMulai: "2026-09-27T09:00:00",
    waktuSelesai: "2026-09-27T10:00:00",
    durasiMenit: 60,
    totalBiaya: 10000,
    status: "Aktif",
    dataPenjualan: {
      id: "j1",
      noReferensi: "INV-1",
      statusPenjualan: "FINAL",
      statusBayar: "UNPAID",
      totalTagihan: 10000,
      sisaTagihan: 10000,
    },
    ...ubah,
  };
}

describe("bookingPerAset", () => {
  it("mengelompokkan booking Aktif dan Selesai per aset", () => {
    const peta = bookingPerAset(
      [
        booking({ id: "b1" }),
        booking({ id: "b2", status: "Selesai" }),
        booking({ id: "b3", dataAset: { id: "a2", namaAset: "Ruang", status: "tersedia" } }),
      ],
      awal,
      akhir,
    );
    expect(peta.get("a1")?.map((b) => b.id)).toEqual(["b1", "b2"]);
    expect(peta.get("a2")?.map((b) => b.id)).toEqual(["b3"]);
  });

  it("membuang booking Batal (keputusan R5a)", () => {
    expect(bookingPerAset([booking({ status: "Batal" })], awal, akhir).size).toBe(0);
  });

  it("membuang booking di luar jendela dan mempertahankan yang bertumpuk di tepinya", () => {
    const peta = bookingPerAset(
      [
        booking({ id: "sebelum", waktuMulai: "2026-09-27T07:00:00", waktuSelesai: "2026-09-27T08:00:00" }),
        booking({ id: "sesudah", waktuMulai: "2026-09-27T14:00:00", waktuSelesai: "2026-09-27T15:00:00" }),
        booking({ id: "tepi", waktuMulai: "2026-09-27T07:30:00", waktuSelesai: "2026-09-27T08:30:00" }),
      ],
      awal,
      akhir,
    );
    expect(peta.get("a1")?.map((b) => b.id)).toEqual(["tepi"]);
  });

  it("menganggap booking tanpa waktuSelesai berlangsung sampai akhir jendela", () => {
    const peta = bookingPerAset(
      [
        booking({ id: "berjalan", waktuMulai: "2026-09-27T07:00:00", waktuSelesai: null }),
        booking({ id: "nanti", waktuMulai: "2026-09-27T14:00:00", waktuSelesai: null }),
      ],
      awal,
      akhir,
    );
    expect(peta.get("a1")?.map((b) => b.id)).toEqual(["berjalan"]);
  });

  it("melewati booking tanpa aset", () => {
    expect(bookingPerAset([booking({ dataAset: null })], awal, akhir).size).toBe(0);
  });
});

describe("tautanPenjualanBooking", () => {
  it("menautkan ke detail penjualan booking (keputusan R4b)", () => {
    expect(tautanPenjualanBooking(booking())).toBe("/dashboard/outlet/penjualan/j1");
  });

  it("mengembalikan null bila booking tidak membawa penjualan", () => {
    expect(tautanPenjualanBooking(booking({ dataPenjualan: null }))).toBeNull();
  });
});