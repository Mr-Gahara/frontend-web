import { describe, expect, it } from "vitest";
import { skemaPelanggan } from "@/features/pelanggan/schema";
import {
  NILAI_AWAL_PELANGGAN,
  isianTidakTerkosongkan,
  nilaiAwalPelanggan,
  payloadBuatPelanggan,
  payloadPerbaruiPelanggan,
} from "@/features/pelanggan/payload";
import { aksiPelanggan } from "@/features/pelanggan/izin";
import type { Pelanggan } from "@/types/pelanggan";

const pelanggan: Pelanggan = {
  id: "64f000000000000000000001",
  tenantID: "64f000000000000000000002",
  namaPelanggan: "Budi Santoso",
  tipePelanggan: "member",
  nomorHp: "08123456789",
  email: null,
  alamat: "Jl. Sudirman No. 123",
  poinLoyalitas: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const isian = (ubah: Partial<typeof NILAI_AWAL_PELANGGAN> = {}) => ({
  ...nilaiAwalPelanggan(pelanggan),
  ...ubah,
});

describe("skemaPelanggan", () => {
  it("menolak nama berisi spasi saja", () => {
    expect(skemaPelanggan.safeParse(isian({ namaPelanggan: "   " })).success).toBe(false);
  });

  it("memangkas setiap isian", () => {
    const hasil = skemaPelanggan.parse(isian({ namaPelanggan: "  Budi  ", alamat: " Jl. A " }));
    expect(hasil.namaPelanggan).toBe("Budi");
    expect(hasil.alamat).toBe("Jl. A");
  });

  it("menerima email kosong dan menolak email yang salah bentuk", () => {
    expect(skemaPelanggan.safeParse(isian({ email: "" })).success).toBe(true);
    expect(skemaPelanggan.safeParse(isian({ email: "budi@email.com" })).success).toBe(true);
    expect(skemaPelanggan.safeParse(isian({ email: "budi-email" })).success).toBe(false);
  });
});

describe("nilaiAwalPelanggan", () => {
  it("mengubah isian null menjadi teks kosong", () => {
    expect(nilaiAwalPelanggan(pelanggan)).toEqual({
      namaPelanggan: "Budi Santoso",
      tipePelanggan: "member",
      nomorHp: "08123456789",
      email: "",
      alamat: "Jl. Sudirman No. 123",
    });
  });
});

describe("payloadBuatPelanggan", () => {
  it("memuat seluruh isian yang diisi", () => {
    expect(payloadBuatPelanggan(isian({ email: "budi@email.com" }))).toEqual({
      namaPelanggan: "Budi Santoso",
      tipePelanggan: "member",
      nomorHp: "08123456789",
      email: "budi@email.com",
      alamat: "Jl. Sudirman No. 123",
    });
  });

  it("tidak mengirim isian opsional yang kosong", () => {
    expect(payloadBuatPelanggan({ ...NILAI_AWAL_PELANGGAN, namaPelanggan: "Budi" })).toEqual({
      namaPelanggan: "Budi",
      tipePelanggan: "umum",
    });
  });
});

describe("payloadPerbaruiPelanggan", () => {
  it("kosong bila tidak ada yang berubah", () => {
    expect(payloadPerbaruiPelanggan(isian(), pelanggan)).toEqual({});
  });

  it("hanya memuat field yang berubah", () => {
    expect(
      payloadPerbaruiPelanggan(isian({ namaPelanggan: "Budi S.", tipePelanggan: "korporat" }), pelanggan),
    ).toEqual({ namaPelanggan: "Budi S.", tipePelanggan: "korporat" });
  });

  it("mengirim teks kosong untuk isian yang dikosongkan", () => {
    expect(payloadPerbaruiPelanggan(isian({ nomorHp: "" }), pelanggan)).toEqual({ nomorHp: "" });
  });
});

describe("isianTidakTerkosongkan", () => {
  it("menyebut isian yang dikosongkan tetapi masih terisi di hasil simpan", () => {
    expect(isianTidakTerkosongkan({ nomorHp: "", alamat: "" }, pelanggan)).toEqual([
      "Nomor HP",
      "Alamat",
    ]);
  });

  it("kosong bila hasil simpan sudah mengosongkannya, atau bila tidak ada yang dikosongkan", () => {
    expect(isianTidakTerkosongkan({ nomorHp: "" }, { ...pelanggan, nomorHp: null })).toEqual([]);
    expect(isianTidakTerkosongkan({ namaPelanggan: "Budi S." }, pelanggan)).toEqual([]);
  });
});

describe("aksiPelanggan", () => {
  it("mengikuti izin endpoint masing-masing", () => {
    expect(aksiPelanggan(["create-pelanggan", "delete-pelanggan"])).toEqual({
      buat: true,
      ubah: false,
      hapus: true,
    });
  });
});