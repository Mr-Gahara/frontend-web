import { describe, expect, it } from "vitest";
import { formatSisa } from "@/features/auth/hitung-mundur";
import { kodeKosong, skemaKode, skemaPasswordBaru } from "@/features/auth/schema";

describe("formatSisa", () => {
  it("menulis sisa detik sebagai m:ss", () => {
    expect(formatSisa(60)).toBe("1:00");
    expect(formatSisa(45)).toBe("0:45");
    expect(formatSisa(5)).toBe("0:05");
  });
  it("tidak pernah negatif", () => {
    expect(formatSisa(-3)).toBe("0:00");
  });
});

describe("skemaKode", () => {
  it("sah bila keenam kotak berisi angka", () => {
    expect(skemaKode.safeParse({ kode: ["6", "0", "4", "2", "1", "8"] }).success).toBe(true);
  });
  it("menolak kotak kosong dan bukan angka", () => {
    expect(skemaKode.safeParse({ kode: kodeKosong() }).success).toBe(false);
    expect(skemaKode.safeParse({ kode: ["6", "0", "4", "2", "1", ""] }).success).toBe(false);
    expect(skemaKode.safeParse({ kode: ["6", "0", "4", "2", "1", "a"] }).success).toBe(false);
  });
  it("kodeKosong selalu menghasilkan larik baru", () => {
    const a = kodeKosong();
    a[0] = "1";
    expect(kodeKosong()).toEqual(["", "", "", "", "", ""]);
  });
});

describe("skemaPasswordBaru", () => {
  const kode = ["6", "0", "4", "2", "1", "8"];
  it("memakai aturan password yang sama dengan daftar", () => {
    const hasil = skemaPasswordBaru.safeParse({ kode, password: "abcdefgh", ulangiPassword: "abcdefgh" });
    expect(hasil.error?.issues[0]?.message).toBe("Password harus mengandung minimal 1 huruf kapital");
  });
  it("menolak password yang tidak sama", () => {
    const hasil = skemaPasswordBaru.safeParse({ kode, password: "Senja2026", ulangiPassword: "Senja2027" });
    expect(hasil.error?.issues[0]?.path).toEqual(["ulangiPassword"]);
  });
  it("sah bila kode, password, dan ulangan sesuai", () => {
    expect(skemaPasswordBaru.safeParse({ kode, password: "Senja2026", ulangiPassword: "Senja2026" }).success).toBe(true);
  });
});