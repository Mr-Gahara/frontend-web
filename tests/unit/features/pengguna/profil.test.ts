import { describe, expect, it } from "vitest";
import {
  hanyaAngka,
  inisialNama,
  kunciFormProfil,
  NILAI_AWAL_PIN,
  nilaiAwalDataDiri,
  payloadDataDiri,
  payloadGantiPin,
  saringNomorHp,
  skemaDataDiri,
  skemaPin,
} from "@/features/pengguna/schema-profil";
import {
  SLUG_TAB_PROFIL,
  teksAkses,
  teksLokasiKerja,
  teksPeranToko,
  teksStatusPengguna,
} from "@/features/pengguna/tampilan-profil";
import { tabDariUrl } from "@/lib/tab-url";
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
  ...ubah,
});

const daftarGalat = (hasil: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  hasil.success || !hasil.error ? [] : hasil.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
const pesan = (nilai: Record<string, string>) => daftarGalat(skemaDataDiri.safeParse(nilai));
const pesanPin = (pinLama: string, pinBaru: string) => daftarGalat(skemaPin.safeParse({ pinLama, pinBaru }));

describe("skemaDataDiri (PU1a)", () => {
  it("menerima nama dan nomor HP, dan memangkas isian", () => {
    const hasil = skemaDataDiri.safeParse(isian({ nama: "  Budi Santoso  ", nomorHp: "08 12" }));
    expect(hasil.success).toBe(false);
    const rapi = skemaDataDiri.safeParse(isian({ nama: "  Budi Santoso  " }));
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
    expect(pesan(isian({ nomorHp: "0812abc" }))).toEqual(["nomorHp: Nomor HP hanya boleh berisi angka"]);
  });
});

describe("skemaPin (PU1a)", () => {
  it("kedua isian kosong ditolak, karena form PIN berdiri sendiri", () => {
    expect(pesanPin("", "")).toEqual([
      "pinLama: Masukkan PIN lama untuk mengonfirmasi perubahan",
      "pinBaru: PIN baru wajib diisi",
    ]);
  });

  it("PIN baru harus tepat 6 digit angka", () => {
    const galat = ["pinBaru: PIN baru harus tepat 6 digit angka"];
    expect(pesanPin("123456", "1234")).toEqual(galat);
    expect(pesanPin("123456", "1234567")).toEqual(galat);
    expect(pesanPin("123456", "12a456")).toEqual(galat);
    expect(pesanPin("123456", "654321")).toEqual([]);
  });

  it("PIN baru tanpa PIN lama, dan PIN lama tanpa PIN baru, ditolak", () => {
    expect(pesanPin("", "654321")).toEqual(["pinLama: Masukkan PIN lama untuk mengonfirmasi perubahan"]);
    expect(pesanPin("123456", "")).toEqual(["pinBaru: PIN baru wajib diisi"]);
  });
});

describe("payload profil (butir 15)", () => {
  it("Data Diri tanpa perubahan menghasilkan payload kosong", () => {
    expect(payloadDataDiri(nilaiAwalDataDiri(pengguna()), pengguna())).toEqual({});
  });

  it("Data Diri hanya mengirim field yang berubah, tanpa PIN", () => {
    expect(payloadDataDiri(isian({ nama: "Budi S" }), pengguna())).toEqual({ nama: "Budi S" });
    expect(payloadDataDiri(isian({ nomorHp: "081300000000" }), pengguna())).toEqual({ nomorHp: "081300000000" });
  });

  it("nomor HP yang dikosongkan dikirim sebagai null", () => {
    expect(payloadDataDiri(isian({ nomorHp: "" }), pengguna())).toEqual({ nomorHp: null });
  });

  it("nomor HP tersimpan null dan isian kosong tidak dikirim", () => {
    const tanpaHp = pengguna({ nomorHp: null });
    expect(nilaiAwalDataDiri(tanpaHp).nomorHp).toBe("");
    expect(payloadDataDiri(isian({ nomorHp: "" }), tanpaHp)).toEqual({});
  });

  it("ganti PIN mengirim pasangan pinLama dan pinBaru saja", () => {
    expect(NILAI_AWAL_PIN).toEqual({ pinLama: "", pinBaru: "" });
    expect(payloadGantiPin({ pinLama: "123456", pinBaru: "654321" })).toEqual({
      pinLama: "123456",
      pinBaru: "654321",
    });
  });
});

describe("tampilan profil (PU1a)", () => {
  it("akses, lokasi kerja, status, serta peran dan toko", () => {
    expect(teksAkses(["web", "app"])).toBe("Web dan Aplikasi");
    expect(teksAkses(["app"])).toBe("Aplikasi");
    expect(teksAkses(["web"])).toBe("Web");
    expect(teksAkses([])).toBe("-");
    expect(teksLokasiKerja(null)).toBe("Tidak dibatasi");
    expect(teksLokasiKerja(undefined)).toBe("Tidak dibatasi");
    expect(teksLokasiKerja({ id: "l1", nama: "Outlet Kemang", tipe: "Outlet" })).toBe("Outlet Kemang");
    expect(teksStatusPengguna("aktif")).toBe("Aktif");
    expect(teksStatusPengguna("non-aktif")).toBe("Non-aktif");
    expect(teksPeranToko("Owner", "Toko3")).toBe("Owner · Toko3");
    expect(teksPeranToko("Owner", "")).toBe("Owner");
  });

  it("tab Keamanan PIN dibaca dari ?tab=keamanan-pin, selain itu Data Diri", () => {
    const tab = (nilai: string | null) => tabDariUrl(nilai, SLUG_TAB_PROFIL, ["data-diri", "pin"] as const, "data-diri");
    expect(tab("keamanan-pin")).toBe("pin");
    expect(tab(null)).toBe("data-diri");
    expect(tab("acak")).toBe("data-diri");
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