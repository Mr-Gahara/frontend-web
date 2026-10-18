import { describe, expect, it } from "vitest";
import { aksiBeban } from "@/features/beban-operasional/izin";
import {
  FILTER_AWAL_BEBAN,
  adaFilterBeban,
  filterServerBeban,
  isianAwalCatat,
  isianAwalUbah,
  payloadBatalBeban,
  payloadBuatBeban,
  payloadUbahBeban,
  pesanAlasanBatal,
  pesanSaldoKurang,
} from "@/features/beban-operasional/payload";
import { buatSkemaCatatBeban, skemaUbahBeban } from "@/features/beban-operasional/schema";
import type { AkunKas } from "@/types/akunKas";
import type { BebanOperasional } from "@/types/bebanOperasional";

const HARI_INI = "2026-10-18";
const isian = {
  akunKasID: "akun-a",
  kategoriBebanID: "kat-a",
  jumlah: " 250000 ",
  tanggal: "2026-10-12",
  keterangan: "  Bayar listrik  ",
};

describe("buatSkemaCatatBeban", () => {
  const skema = buatSkemaCatatBeban(HARI_INI);

  it("menerima isian sah", () => {
    expect(skema.safeParse(isian).success).toBe(true);
  });

  it("menolak jumlah pecahan, nol, kosong, dan bukan angka", () => {
    for (const jumlah of ["1500.75", "0", "", "abc"]) {
      expect(skema.safeParse({ ...isian, jumlah }).success, jumlah).toBe(false);
    }
  });

  it("menolak tanggal sesudah hari ini dan tanggal kosong, menerima hari ini (BO5a)", () => {
    expect(skema.safeParse({ ...isian, tanggal: "2026-10-19" }).success).toBe(false);
    expect(skema.safeParse({ ...isian, tanggal: "" }).success).toBe(false);
    expect(skema.safeParse({ ...isian, tanggal: HARI_INI }).success).toBe(true);
  });

  it("menolak keterangan kosong dan lebih dari 500 karakter", () => {
    expect(skema.safeParse({ ...isian, keterangan: "   " }).success).toBe(false);
    expect(skema.safeParse({ ...isian, keterangan: "a".repeat(501) }).success).toBe(false);
  });
});

describe("payloadBuatBeban", () => {
  it("Owner mengirim tanggal pilihannya, jumlah sebagai angka, dan keterangan dipangkas", () => {
    expect(payloadBuatBeban(isian, true, HARI_INI)).toEqual({
      akunKasID: "akun-a",
      kategoriBebanID: "kat-a",
      jumlah: 250000,
      tanggal: "2026-10-12",
      keterangan: "Bayar listrik",
    });
  });

  it("peran lain selalu mengirim hari ini (BO5a)", () => {
    expect(payloadBuatBeban(isian, false, HARI_INI).tanggal).toBe(HARI_INI);
  });

  it("isian awal bertanggal hari ini", () => {
    expect(isianAwalCatat(HARI_INI)).toEqual({
      akunKasID: "",
      kategoriBebanID: "",
      jumlah: "",
      tanggal: HARI_INI,
      keterangan: "",
    });
  });
});

describe("pesanSaldoKurang", () => {
  it("menahan jumlah di atas saldo, dan diam bila akun belum dipilih", () => {
    const akun = { id: "akun-a", saldo: 100 } as AkunKas;
    expect(pesanSaldoKurang("101", akun)).toBe("Jumlah melebihi saldo akun kas.");
    expect(pesanSaldoKurang("100", akun)).toBeNull();
    expect(pesanSaldoKurang("101", undefined)).toBeNull();
  });
});

describe("ubah beban (BO6a)", () => {
  const beban = {
    id: "b1",
    kategori: { id: "kat-a", namaKategori: "Listrik" },
    keterangan: "Bayar listrik",
  } as BebanOperasional;

  it("payload hanya memuat field yang berubah; spasi tepi bukan perubahan", () => {
    expect(payloadUbahBeban(beban, { kategoriBebanID: "kat-a", keterangan: " Bayar listrik " })).toEqual({});
    expect(payloadUbahBeban(beban, { kategoriBebanID: "kat-b", keterangan: "Bayar listrik" })).toEqual({
      kategoriBebanID: "kat-b",
    });
    expect(payloadUbahBeban(beban, { kategoriBebanID: "kat-a", keterangan: "Listrik dan air" })).toEqual({
      keterangan: "Listrik dan air",
    });
  });

  it("isian awal diambil dari beban", () => {
    expect(isianAwalUbah(beban)).toEqual({ kategoriBebanID: "kat-a", keterangan: "Bayar listrik" });
  });

  it("skema ubah menolak keterangan kosong", () => {
    expect(skemaUbahBeban.safeParse({ kategoriBebanID: "kat-a", keterangan: " " }).success).toBe(false);
  });
});

describe("pembatalan beban", () => {
  it("alasan wajib dan paling panjang 500 karakter", () => {
    expect(pesanAlasanBatal("  ")).toBe("Alasan pembatalan wajib diisi.");
    expect(pesanAlasanBatal("a".repeat(501))).toBe("Alasan pembatalan maksimal 500 karakter.");
    expect(pesanAlasanBatal("Salah akun")).toBeNull();
  });

  it("payload VOID membawa alasan yang dipangkas", () => {
    expect(payloadBatalBeban("  Salah akun  ")).toEqual({ status: "VOID", alasanVoid: "Salah akun" });
  });
});

describe("filterServerBeban", () => {
  it("filter awal tanpa query", () => {
    expect(filterServerBeban(FILTER_AWAL_BEBAN)).toEqual({});
    expect(adaFilterBeban(FILTER_AWAL_BEBAN)).toBe(false);
  });

  it("filter terisi dikirim, dengan periode sebagai tanggal lokal", () => {
    const filter = {
      akunKasID: "akun-a",
      kategoriBebanID: "kat-a",
      status: "VOID" as const,
      dari: new Date(2026, 9, 1),
      sampai: new Date(2026, 9, 18),
    };
    expect(filterServerBeban(filter)).toEqual({
      akunKasID: "akun-a",
      kategoriBebanID: "kat-a",
      status: "VOID",
      dari: "2026-10-01",
      sampai: "2026-10-18",
    });
    expect(adaFilterBeban(filter)).toBe(true);
  });
});

describe("aksiBeban", () => {
  it("mengikuti izin endpoint", () => {
    expect(aksiBeban(["read-beban-operasional"])).toEqual({ baca: true, buat: false, ubah: false });
    expect(
      aksiBeban(["read-beban-operasional", "create-beban-operasional", "update-beban-operasional"]),
    ).toEqual({ baca: true, buat: true, ubah: true });
  });
});