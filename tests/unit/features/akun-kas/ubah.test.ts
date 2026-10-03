import { describe, expect, it } from "vitest";
import {
  adaPerubahanAkunKas,
  isianAwalUbah,
  payloadUbahAkunKas,
  skemaUbahAkunKas,
  urlUbahAkunKas,
} from "../../../../features/akun-kas/ubah";
import { aksiAkunKas } from "../../../../features/akun-kas/izin";
import type { AkunKas } from "../../../../types/akunKas";

const akun: AkunKas = {
  id: "a1",
  tenantID: "t1",
  namaAkun: "Kas Laci",
  nomorAkun: "KAS-001",
  saldo: 150000,
  tipeAkun: "Kas Fisik",
  status: "aktif",
  keterangan: "Laci kasir depan",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("isianAwalUbah", () => {
  it("menyalin field yang boleh diubah dan mengubah keterangan null menjadi isian kosong", () => {
    expect(isianAwalUbah({ ...akun, keterangan: null })).toEqual({
      tipeAkun: "Kas Fisik",
      namaAkun: "Kas Laci",
      nomorAkun: "KAS-001",
      keterangan: "",
    });
  });
});

describe("payloadUbahAkunKas", () => {
  it("kosong bila tidak ada isian yang berubah", () => {
    expect(payloadUbahAkunKas(akun, isianAwalUbah(akun))).toEqual({});
    expect(adaPerubahanAkunKas(akun, isianAwalUbah(akun))).toBe(false);
  });

  it("hanya memuat field yang berubah", () => {
    const isian = { ...isianAwalUbah(akun), namaAkun: "Kas Laci Utama", tipeAkun: "Rekening Bank" as const };
    expect(payloadUbahAkunKas(akun, isian)).toEqual({
      namaAkun: "Kas Laci Utama",
      tipeAkun: "Rekening Bank",
    });
    expect(adaPerubahanAkunKas(akun, isian)).toBe(true);
  });

  it("spasi di tepi tidak dihitung perubahan, dan nilai yang dikirim sudah dipangkas", () => {
    const sama = { ...isianAwalUbah(akun), namaAkun: "  Kas Laci  ", nomorAkun: " KAS-001 " };
    expect(payloadUbahAkunKas(akun, sama)).toEqual({});
    const beda = { ...isianAwalUbah(akun), nomorAkun: "  KAS-002  " };
    expect(payloadUbahAkunKas(akun, beda)).toEqual({ nomorAkun: "KAS-002" });
  });

  it("keterangan yang dikosongkan dikirim null", () => {
    const isian = { ...isianAwalUbah(akun), keterangan: "   " };
    expect(payloadUbahAkunKas(akun, isian)).toEqual({ keterangan: null });
  });

  it("keterangan yang diisi dari null dikirim sebagai teks, dan kosong tetap bukan perubahan", () => {
    const tanpa = { ...akun, keterangan: null };
    expect(payloadUbahAkunKas(tanpa, { ...isianAwalUbah(tanpa), keterangan: "Catatan" })).toEqual({
      keterangan: "Catatan",
    });
    expect(payloadUbahAkunKas(tanpa, isianAwalUbah(tanpa))).toEqual({});
  });

  it("tidak pernah memuat saldo, status, maupun tenantID", () => {
    const isian = {
      tipeAkun: "Rekening Bank" as const,
      namaAkun: "Bank Utama",
      nomorAkun: "123",
      keterangan: "",
    };
    expect(Object.keys(payloadUbahAkunKas(akun, isian)).sort()).toEqual([
      "keterangan",
      "namaAkun",
      "nomorAkun",
      "tipeAkun",
    ]);
  });
});

describe("skemaUbahAkunKas", () => {
  it("menolak nama dan nomor yang kosong atau hanya spasi", () => {
    const hasil = skemaUbahAkunKas.safeParse({
      tipeAkun: "Kas Fisik",
      namaAkun: "   ",
      nomorAkun: "",
      keterangan: "",
    });
    expect(hasil.success).toBe(false);
    const jalur = hasil.success ? [] : hasil.error.issues.map((i) => i.path[0]);
    expect(jalur).toEqual(expect.arrayContaining(["namaAkun", "nomorAkun"]));
  });

  it("menerapkan batas panjang backend: nama 100, nomor 50, keterangan 255", () => {
    const dasar = { tipeAkun: "Kas Fisik", namaAkun: "a", nomorAkun: "1", keterangan: "" };
    const pas = { ...dasar, namaAkun: "a".repeat(100), nomorAkun: "1".repeat(50), keterangan: "k".repeat(255) };
    expect(skemaUbahAkunKas.safeParse(pas).success).toBe(true);
    expect(skemaUbahAkunKas.safeParse({ ...dasar, namaAkun: "a".repeat(101) }).success).toBe(false);
    expect(skemaUbahAkunKas.safeParse({ ...dasar, nomorAkun: "1".repeat(51) }).success).toBe(false);
    expect(skemaUbahAkunKas.safeParse({ ...dasar, keterangan: "k".repeat(256) }).success).toBe(false);
  });
});

describe("izin dan rute", () => {
  it("aksi ubah hanya untuk pemegang update-akunkas", () => {
    expect(aksiAkunKas(["read-akunkas"]).ubah).toBe(false);
    expect(aksiAkunKas(["read-akunkas", "update-akunkas"]).ubah).toBe(true);
  });

  it("rute ubah berada di bawah daftar akun kas", () => {
    expect(urlUbahAkunKas("a1")).toBe("/dashboard/outlet/keuangan/akunkas/a1/ubah");
  });
});