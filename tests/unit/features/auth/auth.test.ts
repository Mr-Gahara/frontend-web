import { describe, expect, it } from "vitest";
import { hasilLoginPengguna } from "@/features/auth/hasil";
import { skemaLoginAkun, skemaLoginPengguna } from "@/features/auth/schema";

const pesan = (skema: typeof skemaLoginAkun | typeof skemaLoginPengguna, nilai: unknown) => {
  const hasil = skema.safeParse(nilai);
  return hasil.success ? [] : hasil.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("skemaLoginAkun", () => {
  it("menerima email dan password, dan memangkas email", () => {
    const hasil = skemaLoginAkun.safeParse({ email: "  toko@contoh.id ", password: " rahasia " });
    expect(hasil.success && hasil.data).toEqual({ email: "toko@contoh.id", password: " rahasia " });
  });

  it("menolak email kosong dan email berformat salah dengan pesan berbeda", () => {
    expect(pesan(skemaLoginAkun, { email: "", password: "x" })).toEqual(["email: Email wajib diisi"]);
    expect(pesan(skemaLoginAkun, { email: "ini-bukan-email", password: "x" })).toEqual([
      "email: Format email tidak valid",
    ]);
  });

  it("menolak password kosong", () => {
    expect(pesan(skemaLoginAkun, { email: "a@b.id", password: "" })).toEqual([
      "password: Password wajib diisi",
    ]);
  });
});

describe("skemaLoginPengguna", () => {
  it("menerima nama dan PIN angka, dan memangkas nama", () => {
    const hasil = skemaLoginPengguna.safeParse({ nama: " Ridho ", pin: "123456" });
    expect(hasil.success && hasil.data).toEqual({ nama: "Ridho", pin: "123456" });
  });

  it("menolak nama kosong, PIN kosong, dan PIN berisi huruf", () => {
    expect(pesan(skemaLoginPengguna, { nama: "  ", pin: "" })).toEqual([
      "nama: Nama pengguna wajib diisi",
      "pin: PIN wajib diisi",
    ]);
    expect(pesan(skemaLoginPengguna, { nama: "Ridho", pin: "12a4" })).toEqual([
      "pin: PIN hanya boleh berisi angka",
    ]);
  });

  it("tidak memaksakan panjang PIN saat login", () => {
    expect(pesan(skemaLoginPengguna, { nama: "Ridho", pin: "1234" })).toEqual([]);
  });
});

describe("hasilLoginPengguna", () => {
  it("mengambil token dari accessToken tingkat atas", () => {
    expect(hasilLoginPengguna({ accessToken: "abc" })).toEqual({ token: "abc" });
  });

  it("respons tanpa token dianggap gagal", () => {
    const galat = { galat: "Token pengguna gagal diterbitkan." };
    expect(hasilLoginPengguna({})).toEqual(galat);
    expect(hasilLoginPengguna({ accessToken: "" })).toEqual(galat);
    expect(hasilLoginPengguna(null)).toEqual(galat);
  });

  it("success false menampilkan pesan backend walau membawa token", () => {
    expect(
      hasilLoginPengguna({ success: false, message: "Perangkat menunggu persetujuan owner." }),
    ).toEqual({ galat: "Perangkat menunggu persetujuan owner." });
    expect(hasilLoginPengguna({ success: false })).toEqual({
      galat: "Login belum dapat dilanjutkan.",
    });
  });
});