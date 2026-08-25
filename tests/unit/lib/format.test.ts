import { describe, it, expect } from "vitest";
import { formatRupiah, formatTanggal, formatTanggalPendek } from "@/lib/format";

describe("Format - formatRupiah", () => {
  it("harus memformat angka positif menjadi format rupiah (Happy Path)", () => {
    const result = formatRupiah(100000);
    expect(result).toMatch(/Rp\s*100\.000/);
  });

  it("harus memformat angka nol dengan benar (Edge Case)", () => {
    expect(formatRupiah(0)).toMatch(/Rp\s*0/);
  });

  it("harus memformat angka negatif dengan tanda minus (Unhappy Path)", () => {
    const result = formatRupiah(-50000);
    expect(result).toMatch(/-Rp\s*50\.000|Rp\s*-50\.000/);
  });
});

describe("Format - Tanggal", () => {
  const validIso = "2026-08-25T15:36:24.000Z";

  it("harus memformat tanggal panjang dengan jam dan menit (Happy Path)", () => {
    const result = formatTanggal(validIso);
    expect(result).toContain("2026");
    expect(result).toMatch(/25|Agu/);
    expect(result).toMatch(/[:.]/); // Menerima format 22:36 maupun 22.36
  });

  it("harus memformat tanggal pendek tanpa jam dan menit (Happy Path)", () => {
    const result = formatTanggalPendek(validIso);
    expect(result).toContain("2026");
    expect(result).not.toContain(":");
  });

  it('harus mengembalikan string "-" jika string tanggal tidak valid (Unhappy Path - Bug Fixed)', () => {
    // Sebelumnya kita expect throw RangeError, sekarang kita expect nilai fallback yang aman
    expect(formatTanggal("tanggal-ngawur")).toBe("-");
    expect(formatTanggal("")).toBe("-");
  });
});
