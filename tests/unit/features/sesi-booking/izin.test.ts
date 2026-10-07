import { describe, expect, it } from "vitest";
import { bolehBacaBooking, bolehTandaiSelesai } from "@/features/sesi-booking/izin";

const kini = new Date("2026-10-07T10:00:00");
const dasar = { status: "Aktif", sudahDibayar: true, waktuSelesai: "2026-10-07T11:00:00" } as const;
const UBAH = ["update-booking"];

describe("izin sesi booking (NZ7a)", () => {
  it("tandai selesai hanya untuk booking Aktif yang sudah dibayar dan belum lewat jamnya, bagi pemegang update-booking", () => {
    expect(bolehTandaiSelesai(dasar, UBAH, kini)).toBe(true);
    expect(bolehTandaiSelesai({ ...dasar, waktuSelesai: null }, UBAH, kini)).toBe(true);
    expect(bolehTandaiSelesai({ ...dasar, sudahDibayar: false }, UBAH, kini)).toBe(false);
    expect(bolehTandaiSelesai({ ...dasar, status: "Selesai" }, UBAH, kini)).toBe(false);
    expect(bolehTandaiSelesai({ ...dasar, status: "VOID" }, UBAH, kini)).toBe(false);
    expect(bolehTandaiSelesai({ ...dasar, waktuSelesai: "2026-10-07T09:59:00" }, UBAH, kini)).toBe(false);
    expect(bolehTandaiSelesai(dasar, ["read-booking"], kini)).toBe(false);
  });

  it("booking penjualan hanya dimuat bagi pemegang read-booking", () => {
    expect(bolehBacaBooking(["read-booking"])).toBe(true);
    expect(bolehBacaBooking(["read-penjualan"])).toBe(false);
  });
});