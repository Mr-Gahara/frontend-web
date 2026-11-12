import { describe, expect, it } from "vitest";
import { periksaPemilikCache, type PemilikCache } from "@/lib/auth/pemilik-cache";

const kosong: PemilikCache = { akunID: null, penggunaID: null };
const sesi = (akun: string | null, pengguna: string | null) => ({
  akun: akun ? { id: akun } : null,
  pengguna: pengguna ? { id: pengguna } : null,
});

/** Menjalankan urutan sesi dan mengembalikan langkah yang membersihkan cache. */
function jalankan(urutan: ReturnType<typeof sesi>[]) {
  let pemilik = kosong;
  return urutan.map((s) => {
    const hasil = periksaPemilikCache(pemilik, s);
    pemilik = hasil.pemilik;
    return hasil.bersihkan;
  });
}

describe("periksaPemilikCache", () => {
  it("login pertama tidak membersihkan cache", () => {
    expect(jalankan([sesi(null, null), sesi("A", null), sesi("A", "ridho")])).toEqual([false, false, false]);
  });

  it("logout lalu akun lain masuk membersihkan cache saat akun lain itu masuk", () => {
    expect(
      jalankan([sesi("A", "ridho"), sesi(null, null), sesi("B", null), sesi("B", "rusdi")]),
    ).toEqual([false, false, true, false]);
  });

  it("logout lalu akun dan pengguna yang sama masuk lagi tidak membersihkan cache", () => {
    expect(jalankan([sesi("A", "ridho"), sesi(null, null), sesi("A", null), sesi("A", "ridho")])).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it("ganti pengguna di akun yang sama membersihkan cache saat pengguna lain masuk", () => {
    expect(jalankan([sesi("A", "ridho"), sesi("A", null), sesi("A", "kasir")])).toEqual([false, false, true]);
  });

  it("token pengguna yang diperbarui untuk pengguna yang sama tidak membersihkan cache", () => {
    expect(jalankan([sesi("A", "ridho"), sesi("A", "ridho")])).toEqual([false, false]);
  });

  it("akun lain tanpa logout pengguna lebih dulu tetap membersihkan, dan pengguna lama bukan pemilik lagi", () => {
    const hasil = periksaPemilikCache({ akunID: "A", penggunaID: "ridho" }, sesi("B", null));
    expect(hasil).toEqual({ bersihkan: true, pemilik: { akunID: "B", penggunaID: null } });
  });
});
