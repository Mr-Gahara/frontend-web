import { describe, expect, it } from "vitest";
import {
  hanyaAngka,
  inisialNama,
  kunciFormProfil,
  nilaiAwalProfil,
  payloadPerbaruiProfil,
  saringNomorHp,
  skemaProfil,
} from "@/features/pengguna/schema-profil";
import type { PenggunaDetail } from "@/types/pengguna";

const pengguna = (ubah: Partial<PenggunaDetail> = {}): PenggunaDetail => ({
  id: "p1",
  nama: "Budi Santoso",
  nomorHp: "081234567890",
  status: "aktif",
  fotoKaryawan: null,
  aksesType: ["web"],
  roleID: "r1",
  role: "Kasir",
  ...ubah,
});

const isian = (ubah: Record<string, string> = {}) => ({
  nama: "Budi Santoso",
  nomorHp: "081234567890",
  pinLama: "",
  pinBaru: "",
  ...ubah,
});

const pesan = (nilai: Record<string, string>) => {
  const hasil = skemaProfil.safeParse(nilai);
  return hasil.success ? [] : hasil.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("skemaProfil", () => {
  it("menerima nama dan nomor HP tanpa PIN, dan memangkas isian", () => {
    const hasil = skemaProfil.safeParse(isian({ nama: "  Budi Santoso  ", nomorHp: "08 12" }));
    expect(hasil.success).toBe(false);
    const rapi = skemaProfil.safeParse(isian({ nama: "  Budi Santoso  " }));
    expect(rapi.success && rapi.data.nama).toBe("Budi Santoso");
  });

  it("menolak nama kosong, berisi spasi saja, di bawah 3, dan di atas 50 karakter", () => {
    expect(pesan(isian({ nama: "" }))).toContain("nama: Nama wajib diisi");
    expect(pesan(isian({ nama: "   " }))).toContain("nama: Nama wajib diisi");
    expect(pesan(isian({ nama: "ab" }))).toContain("nama: Nama minimal 3 karakter");
    expect(pesan(isian({ nama: "a".repeat(51) }))).toContain("nama: Nama maksimal 50 karakter");
  });

  it("nomor HP boleh kosong atau berawalan +, tetapi tidak boleh berisi huruf", () => {
    expect(pesan(isian({ nomorHp: "" }))).toEqual([]);
    expect(pesan(isian({ nomorHp: "+6281234567890" }))).toEqual([]);
    expect(pesan(isian({ nomorHp: "0812abc" }))).toContain(
      "nomorHp: Nomor HP hanya boleh berisi angka",
    );
  });

  it("PIN baru harus tepat 6 digit angka", () => {
    const galat = "pinBaru: PIN baru harus tepat 6 digit angka";
    expect(pesan(isian({ pinLama: "123456", pinBaru: "1234" }))).toContain(galat);
    expect(pesan(isian({ pinLama: "123456", pinBaru: "1234567" }))).toContain(galat);
    expect(pesan(isian({ pinLama: "123456", pinBaru: "12a456" }))).toContain(galat);
    expect(pesan(isian({ pinLama: "123456", pinBaru: "654321" }))).toEqual([]);
  });

  it("PIN baru tanpa PIN lama ditolak", () => {
    expect(pesan(isian({ pinBaru: "654321" }))).toEqual([
      "pinLama: Masukkan PIN lama untuk mengonfirmasi perubahan",
    ]);
  });

  it("PIN lama tanpa PIN baru ditolak", () => {
    expect(pesan(isian({ pinLama: "123456" }))).toEqual([
      "pinBaru: Isi PIN baru, atau kosongkan PIN lama bila tidak mengubah PIN",
    ]);
  });
});

describe("payloadPerbaruiProfil", () => {
  it("tanpa perubahan menghasilkan payload kosong", () => {
    expect(payloadPerbaruiProfil(nilaiAwalProfil(pengguna()), pengguna())).toEqual({});
  });

  it("hanya mengirim field yang berubah", () => {
    expect(payloadPerbaruiProfil(isian({ nama: "Budi S" }), pengguna())).toEqual({ nama: "Budi S" });
    expect(payloadPerbaruiProfil(isian({ nomorHp: "081300000000" }), pengguna())).toEqual({
      nomorHp: "081300000000",
    });
  });

  it("nomor HP yang dikosongkan dikirim sebagai null", () => {
    expect(payloadPerbaruiProfil(isian({ nomorHp: "" }), pengguna())).toEqual({ nomorHp: null });
  });

  it("nomor HP tersimpan null dan isian kosong tidak dikirim", () => {
    const tanpaHp = pengguna({ nomorHp: null });
    expect(nilaiAwalProfil(tanpaHp).nomorHp).toBe("");
    expect(payloadPerbaruiProfil(isian({ nomorHp: "" }), tanpaHp)).toEqual({});
  });

  it("PIN dikirim sebagai pasangan pinLama dan pinBaru, tanpa field lain", () => {
    expect(
      payloadPerbaruiProfil(isian({ pinLama: "123456", pinBaru: "654321" }), pengguna()),
    ).toEqual({ pinLama: "123456", pinBaru: "654321" });
  });
});

describe("penyaring isian dan tampilan", () => {
  it("hanyaAngka membuang karakter selain angka", () => {
    expect(hanyaAngka("12a 3-4")).toBe("1234");
  });

  it("saringNomorHp menyisakan angka dan satu + di depan", () => {
    expect(saringNomorHp("+62 812-345")).toBe("+62812345");
    expect(saringNomorHp("08+12a")).toBe("0812");
    expect(saringNomorHp("++62")).toBe("+62");
  });

  it("inisialNama dan kunciFormProfil", () => {
    expect(inisialNama(" budi santoso")).toBe("BU");
    expect(inisialNama("")).toBe("US");
    expect(kunciFormProfil(pengguna())).toBe("p1|Budi Santoso|081234567890");
    expect(kunciFormProfil(pengguna({ nomorHp: null }))).toBe("p1|Budi Santoso|");
  });
});