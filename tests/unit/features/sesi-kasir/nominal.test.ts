import { describe, expect, it } from "vitest";
import { angkaDariTeks, teksRibuan } from "@/features/sesi-kasir/nominal";

describe("isian nominal tutup kasir", () => {
  it("hanya digit yang dibaca", () => {
    expect(angkaDariTeks("1.284.000")).toBe(1284000);
    expect(angkaDariTeks("Rp 25.000,-")).toBe(25000);
    expect(angkaDariTeks("000")).toBe(0);
    expect(angkaDariTeks("")).toBeNull();
    expect(angkaDariTeks("abc")).toBeNull();
    expect(angkaDariTeks("9".repeat(20))).toBeNull();
  });

  it("tampilan berpemisah ribuan", () => {
    expect(teksRibuan(1284000)).toBe("1.284.000");
    expect(teksRibuan(0)).toBe("0");
    expect(teksRibuan(null)).toBe("");
  });
});