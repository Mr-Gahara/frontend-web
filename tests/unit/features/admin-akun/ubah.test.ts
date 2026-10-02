import { describe, it, expect } from "vitest";
import {
  aksiKelolaAkun,
  nilaiAwalUbahAkun,
  payloadPerbaruiAkun,
  skemaUbahAkun,
  type NilaiUbahAkun,
} from "@/features/admin-akun/ubah";
import type { AkunAdmin } from "@/types/adminAkun";

const akun = (ubah: Partial<AkunAdmin> = {}): AkunAdmin => ({
  id: "a1",
  username: "budi",
  email: "budi@contoh.id",
  role: "client",
  status: "aktif",
  daftarTenant: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  langganan: {
    aksesBerakhirPada: null,
    alasanNonAktif: null,
    dibekukanPada: null,
    masaTenggangHari: 7,
  },
  ...ubah,
});

const isian = (ubah: Partial<NilaiUbahAkun> = {}): NilaiUbahAkun => ({
  ...nilaiAwalUbahAkun(akun()),
  ...ubah,
});

const sah = (nilai: NilaiUbahAkun) => skemaUbahAkun.safeParse(nilai).success;

describe("skemaUbahAkun", () => {
  it("password kosong diterima: tidak diganti", () => {
    expect(sah(isian())).toBe(true);
  });

  it("password baru yang lemah ditolak", () => {
    expect(sah(isian({ password: "lemah" }))).toBe(false);
    expect(sah(isian({ password: "tanpakapital1" }))).toBe(false);
    expect(sah(isian({ password: "TanpaAngka" }))).toBe(false);
  });

  it("password baru yang kuat diterima", () => {
    expect(sah(isian({ password: "Rahasia123" }))).toBe(true);
  });

  it("email dan username mengikuti aturan buat akun", () => {
    expect(sah(isian({ email: "bukan-email" }))).toBe(false);
    expect(sah(isian({ username: "ab" }))).toBe(false);
  });
});

describe("payloadPerbaruiAkun", () => {
  it("tanpa perubahan menghasilkan payload kosong", () => {
    expect(payloadPerbaruiAkun(isian(), akun())).toEqual({});
  });

  it("email yang berubah dikirim terpangkas; beda huruf saja bukan perubahan", () => {
    expect(payloadPerbaruiAkun(isian({ email: " baru@contoh.id " }), akun())).toEqual({
      email: "baru@contoh.id",
    });
    expect(payloadPerbaruiAkun(isian({ email: "BUDI@contoh.id" }), akun())).toEqual({});
  });

  it("username yang dikosongkan dikirim sebagai null", () => {
    expect(payloadPerbaruiAkun(isian({ username: "  " }), akun())).toEqual({ username: null });
    expect(payloadPerbaruiAkun(isian({ username: "budi-baru" }), akun())).toEqual({
      username: "budi-baru",
    });
  });

  it("password hanya dikirim bila diisi", () => {
    expect(payloadPerbaruiAkun(isian({ password: "Rahasia123" }), akun())).toEqual({
      password: "Rahasia123",
    });
  });

  it("nilai awal: username null menjadi teks kosong tanpa dianggap berubah", () => {
    const tanpaUsername = akun({ username: null });
    expect(nilaiAwalUbahAkun(tanpaUsername).username).toBe("");
    expect(payloadPerbaruiAkun(nilaiAwalUbahAkun(tanpaUsername), tanpaUsername)).toEqual({});
  });
});

describe("aksiKelolaAkun", () => {
  it("klien aktif: ubah, dan hapus tampil tetapi nonaktif", () => {
    expect(aksiKelolaAkun(akun())).toEqual({ ubah: true, hapusTampil: true, hapusAktif: false });
  });

  it("klien non-aktif: hapus aktif", () => {
    expect(aksiKelolaAkun(akun({ status: "non-aktif" })).hapusAktif).toBe(true);
  });

  it("akun admin: tanpa ubah dan tanpa hapus", () => {
    expect(aksiKelolaAkun(akun({ role: "admin" }))).toEqual({
      ubah: false,
      hapusTampil: false,
      hapusAktif: false,
    });
  });
});