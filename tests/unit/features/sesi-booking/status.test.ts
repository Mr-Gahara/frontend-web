import { describe, expect, it } from "vitest";
import { bookingBertumpukBelumDibayar, labelStatusBooking } from "@/features/sesi-booking/status";
import type { SesiBookingResponse } from "@/types/sesiBooking";

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
    sudahDibayar: false,
    dataPenjualan: null,
    ...ubah,
  };
}

const mulai = new Date("2026-09-27T09:30:00");
const selesai = new Date("2026-09-27T10:30:00");

describe("bookingBertumpukBelumDibayar", () => {
  it("mengembalikan booking Aktif belum dibayar yang bertumpuk di aset yang sama", () => {
    const b = booking();
    expect(bookingBertumpukBelumDibayar([b], "a1", mulai, selesai)).toBe(b);
  });

  it("tidak menghitung booking sudah dibayar, status selain Aktif, aset lain, atau yang hanya bersentuhan", () => {
    expect(bookingBertumpukBelumDibayar([booking({ sudahDibayar: true })], "a1", mulai, selesai)).toBeNull();
    expect(
      bookingBertumpukBelumDibayar([booking({ status: "VOID" }), booking({ status: "Selesai" })], "a1", mulai, selesai),
    ).toBeNull();
    expect(bookingBertumpukBelumDibayar([booking()], "a2", mulai, selesai)).toBeNull();
    expect(
      bookingBertumpukBelumDibayar([booking()], "a1", new Date("2026-09-27T10:00:00"), new Date("2026-09-27T11:00:00")),
    ).toBeNull();
  });
});

describe("labelStatusBooking", () => {
  it("label untuk Selesai, kosong untuk Aktif dan VOID", () => {
    expect(labelStatusBooking("Selesai")).toBe(" · Selesai");
    expect(labelStatusBooking("VOID")).toBe("");
    expect(labelStatusBooking("Aktif")).toBe("");
  });
});