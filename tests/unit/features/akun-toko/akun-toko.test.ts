import { describe, expect, it } from "vitest";
import { bolehKelolaAkunToko } from "@/features/akun-toko/izin";
import { kodeLengkap, skemaEmailBaru, skemaPasswordAkun } from "@/features/akun-toko/schema";

describe("bolehKelolaAkunToko (OA8a)", () => {
  it("hanya Owner pemegang update-akun", () => {
    expect(bolehKelolaAkunToko(["update-akun"], 100)).toBe(true);
    expect(bolehKelolaAkunToko(["update-akun"], 90)).toBe(false);
    expect(bolehKelolaAkunToko(["read-akun"], 100)).toBe(false);
  });
});

describe("skemaEmailBaru", () => {
  const skema = skemaEmailBaru("toko@gmail.com");
  it("menerima email baru yang sah", () => {
    expect(skema.safeParse({ email: " baru@toko.com " }).data?.email).toBe("baru@toko.com");
  });
  it("menolak kosong, format salah, dan email yang sama tanpa beda huruf besar", () => {
    expect(skema.safeParse({ email: "" }).error?.issues[0]?.message).toBe("Email baru wajib diisi");
    expect(skema.safeParse({ email: "bukan-email" }).error?.issues[0]?.message).toBe("Format email tidak valid");
    expect(skema.safeParse({ email: "Toko@Gmail.com" }).error?.issues[0]?.message).toBe(
      "Email baru sama dengan email saat ini",
    );
  });
});

describe("skemaPasswordAkun", () => {
  it("menuntut password lama dan aturan password baru yang sama dengan backend", () => {
    const hasil = skemaPasswordAkun.safeParse({ passwordLama: "", password: "abcdefgh", ulangiPassword: "abcdefgh" });
    expect(hasil.error?.issues.map((i) => i.message)).toEqual([
      "Password lama wajib diisi",
      "Password harus mengandung minimal 1 huruf kapital",
      "Password harus mengandung minimal 1 angka",
    ]);
  });
  it("menolak ulangi password yang berbeda", () => {
    const hasil = skemaPasswordAkun.safeParse({ passwordLama: "Lama1234", password: "Baru1234", ulangiPassword: "Baru1235" });
    expect(hasil.error?.issues[0]?.path).toEqual(["ulangiPassword"]);
  });
});

describe("kodeLengkap", () => {
  it("sah hanya untuk 6 digit angka", () => {
    expect(kodeLengkap(["4", "8", "2", "9", "1", "3"])).toBe(true);
    expect(kodeLengkap(["4", "8", "2", "9", "1", ""])).toBe(false);
    expect(kodeLengkap(["4", "8", "2", "9", "1", "a"])).toBe(false);
  });
});
