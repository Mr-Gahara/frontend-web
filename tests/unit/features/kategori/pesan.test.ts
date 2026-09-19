import { describe, expect, it } from "vitest";
import { pesanErrorKategori } from "@/features/kategori/pesan";
import type { Kategori } from "@/types/kategori";

function kategori(id: string, namaKategori: string, kodeKategori: string): Kategori {
  return { id, namaKategori, kodeKategori, createdAt: "", updatedAt: "" };
}

const daftar = [
  kategori("1", "Minuman", "MNM"),
  kategori("2", "Makanan", "MKN"),
];

const duplikat = new Error("tenantID sudah digunakan di tenant ini");

describe("pesanErrorKategori", () => {
  it("meneruskan pesan yang bukan penolakan duplikat", () => {
    const pesan = pesanErrorKategori(new Error("Server sibuk"), "Gagal", {
      nilai: { namaKategori: "Minuman", kodeKategori: "MNM" },
      daftar,
    });
    expect(pesan).toBe("Server sibuk");
  });

  it("menyebut kode bila hanya kode yang bentrok", () => {
    const pesan = pesanErrorKategori(duplikat, "Gagal", {
      nilai: { namaKategori: "Roti", kodeKategori: "MNM" },
      daftar,
    });
    expect(pesan).toBe("Kode kategori sudah dipakai.");
  });

  it("menyebut nama bila hanya nama yang bentrok", () => {
    const pesan = pesanErrorKategori(duplikat, "Gagal", {
      nilai: { namaKategori: "Makanan", kodeKategori: "RTI" },
      daftar,
    });
    expect(pesan).toBe("Nama kategori sudah dipakai.");
  });

  it("menyebut keduanya bila nama dan kode sama-sama bentrok", () => {
    const pesan = pesanErrorKategori(duplikat, "Gagal", {
      nilai: { namaKategori: "Minuman", kodeKategori: "MKN" },
      daftar,
    });
    expect(pesan).toBe("Nama kategori dan kode kategori sudah dipakai.");
  });

  it("tidak menganggap kategori yang sedang diedit sebagai bentrok", () => {
    const pesan = pesanErrorKategori(duplikat, "Gagal", {
      nilai: { namaKategori: "Minuman", kodeKategori: "MNM" },
      daftar,
      idDiedit: "1",
    });
    expect(pesan).toBe("Nama atau kode kategori sudah dipakai.");
  });

  it("memakai pesan umum bila bentrok tidak terlihat di daftar", () => {
    const pesan = pesanErrorKategori(duplikat, "Gagal", {
      nilai: { namaKategori: "Roti", kodeKategori: "RTI" },
      daftar,
    });
    expect(pesan).toBe("Nama atau kode kategori sudah dipakai.");
  });
});