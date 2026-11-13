import { describe, expect, it } from "vitest";
import { kodeKosong, skemaResetPinOwner } from "@/features/auth/schema";

const kode = ["6", "0", "4", "2", "1", "8"];
const sah = { kode, password: "Rahasia1", pinBaru: "654321", ulangiPin: "654321" };
const pesan = (nilai: object) =>
  skemaResetPinOwner.safeParse(nilai).error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`);

describe("skemaResetPinOwner (B178, OA1a)", () => {
  it("sah dengan kode 6 digit, password terisi, dan PIN baru 6 digit yang sama", () => {
    expect(skemaResetPinOwner.safeParse(sah).success).toBe(true);
  });
  it("menuntut kode lengkap dan password akun", () => {
    expect(pesan({ ...sah, kode: kodeKosong(), password: "" })).toEqual([
      "kode: Masukkan 6 digit kode verifikasi.",
      "password: Password akun toko wajib diisi",
    ]);
  });
  it("PIN baru tepat 6 digit angka", () => {
    expect(pesan({ ...sah, pinBaru: "12345", ulangiPin: "12345" })).toEqual(["pinBaru: PIN baru harus 6 digit angka"]);
    expect(pesan({ ...sah, pinBaru: "12345a", ulangiPin: "12345a" })).toEqual(["pinBaru: PIN baru harus 6 digit angka"]);
  });
  it("menolak ulangi PIN yang berbeda", () => {
    expect(pesan({ ...sah, ulangiPin: "654320" })).toEqual(["ulangiPin: PIN tidak sama"]);
  });
});
