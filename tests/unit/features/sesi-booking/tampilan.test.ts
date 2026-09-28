import { describe, expect, it } from "vitest";
import { bookingBentrok, bookingPerAset, tautanPenjualanBooking } from "@/features/sesi-booking/tampilan";
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

describe("bookingBentrok", () => {
  const mulai = new Date("2026-09-27T09:30:00");
  const selesai = new Date("2026-09-27T10:30:00");

  it("mengembalikan booking Aktif di aset yang sama yang bertumpuk", () => {
    const b = booking({ id: "aktif" });
    expect(bookingBentrok([b], "a1", mulai, selesai)).toBe(b);
  });

  it("tidak menghitung booking Selesai maupun Batal (keputusan R6a)", () => {
    const daftar = [booking({ status: "Selesai" }), booking({ status: "Batal" })];
    expect(bookingBentrok(daftar, "a1", mulai, selesai)).toBeNull();
  });

  it("tidak menghitung aset lain maupun rentang yang hanya bersentuhan di tepi", () => {
    expect(bookingBentrok([booking()], "a2", mulai, selesai)).toBeNull();
    expect(
      bookingBentrok([booking()], "a1", new Date("2026-09-27T10:00:00"), new Date("2026-09-27T11:00:00")),
    ).toBeNull();
  });

  it("menganggap booking tanpa waktuSelesai berlangsung satu jam", () => {
    const tanpaSelesai = booking({ waktuSelesai: null });
    expect(
      bookingBentrok([tanpaSelesai], "a1", new Date("2026-09-27T09:59:00"), new Date("2026-09-27T10:30:00")),
    ).toBe(tanpaSelesai);
    expect(
      bookingBentrok([tanpaSelesai], "a1", new Date("2026-09-27T10:00:00"), new Date("2026-09-27T10:30:00")),
    ).toBeNull();
  });

  it("mengembalikan null bila aset belum dipilih", () => {
    expect(bookingBentrok([booking()], "", mulai, selesai)).toBeNull();
  });
});