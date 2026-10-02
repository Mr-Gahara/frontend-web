import { describe, expect, it } from "vitest";
import { skemaDiskon } from "@/features/diskon/schema";
import {
  NILAI_AWAL_DISKON,
  nilaiAwalDiskon,
  payloadBuatDiskon,
  payloadPerbaruiDiskon,
} from "@/features/diskon/payload";
import {
  ATURAN_DISKON_KOSONG,
  BATAS_DISKON_AKTIF,
  aktifTetapiTidakBerlaku,
  masihDalamBatas,
  ringkasAturan,
  saringDiskon,
  teksNilai,
} from "@/features/diskon/tampilan";
import { aksiDiskon } from "@/features/diskon/izin";
import type { Diskon } from "@/types/diskon";

const diskon = (ubah: Partial<Diskon> = {}): Diskon => ({
  id: "64f000000000000000000001",
  namaDiskon: "Promo Uji",
  cakupan: "Global",
  tipe: "persen",
  nilai: 10,
  bisaDigabung: false,
  status: "Aktif",
  ...ATURAN_DISKON_KOSONG,
  tenantID: "64f000000000000000000002",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...ubah,
});

const isian = (ubah: Partial<typeof NILAI_AWAL_DISKON> = {}) => ({
  ...nilaiAwalDiskon(diskon()),
  ...ubah,
});

describe("skemaDiskon", () => {
  it("menolak nama berisi spasi saja", () => {
    expect(skemaDiskon.safeParse(isian({ namaDiskon: "   " })).success).toBe(false);
  });

  it("menolak nilai kosong, nol, dan bukan angka", () => {
    for (const nilai of ["", "0", "abc", "-5"]) {
      expect(skemaDiskon.safeParse(isian({ nilai })).success).toBe(false);
    }
  });

  it("menolak persen di atas 100, tetapi menerima nominal di atas 100", () => {
    expect(skemaDiskon.safeParse(isian({ tipe: "persen", nilai: "101" })).success).toBe(false);
    expect(skemaDiskon.safeParse(isian({ tipe: "persen", nilai: "100" })).success).toBe(true);
    expect(skemaDiskon.safeParse(isian({ tipe: "nominal", nilai: "5000" })).success).toBe(true);
  });
});

describe("payload diskon", () => {
  it("buat memuat keenam field, dengan nilai sebagai angka", () => {
    expect(payloadBuatDiskon(isian({ nilai: "15", status: "Non-Aktif" }))).toEqual({
      namaDiskon: "Promo Uji",
      cakupan: "Global",
      tipe: "persen",
      nilai: 15,
      bisaDigabung: false,
      status: "Non-Aktif",
    });
  });

  it("ubah kosong bila tidak ada yang berubah", () => {
    expect(payloadPerbaruiDiskon(isian(), diskon())).toEqual({});
  });

  it("ubah hanya memuat field yang berubah", () => {
    expect(payloadPerbaruiDiskon(isian({ nilai: "20", bisaDigabung: true }), diskon())).toEqual({
      nilai: 20,
      bisaDigabung: true,
    });
  });

  it("nilai yang ditulis berbeda tetapi sama angkanya tidak dianggap berubah", () => {
    expect(payloadPerbaruiDiskon(isian({ nilai: "10.0" }), diskon())).toEqual({});
  });
});

describe("saringDiskon dan batas", () => {
  const daftar = [
    diskon({ id: "a" }),
    diskon({ id: "b", status: "Non-Aktif" }),
    diskon({ id: "c", cakupan: "Item", tipe: "nominal", nilai: 5000 }),
  ];

  it("menyaring menurut status, cakupan, dan tipe sekaligus", () => {
    expect(saringDiskon(daftar, { status: "all", cakupan: "all", tipe: "all" })).toHaveLength(3);
    expect(saringDiskon(daftar, { status: "Non-Aktif", cakupan: "all", tipe: "all" }).map((d) => d.id)).toEqual(["b"]);
    expect(saringDiskon(daftar, { status: "Aktif", cakupan: "Item", tipe: "nominal" }).map((d) => d.id)).toEqual(["c"]);
  });

  it("batas hanya menghitung diskon berstatus Aktif", () => {
    const penuh = Array.from({ length: BATAS_DISKON_AKTIF }, (_, i) => diskon({ id: String(i) }));
    expect(masihDalamBatas(penuh)).toBe(false);
    expect(masihDalamBatas([...penuh.slice(1), diskon({ id: "x", status: "Non-Aktif" })])).toBe(true);
  });
});

describe("tampilan diskon", () => {
  it("nilai persen dan nominal", () => {
    expect(teksNilai({ tipe: "persen", nilai: 15 })).toBe("15%");
    expect(teksNilai({ tipe: "nominal", nilai: 500 })).toBe("Rp 500");
  });

  it("diskon tanpa aturan tidak punya ringkasan", () => {
    expect(ringkasAturan(diskon())).toEqual([]);
  });

  it("setiap aturan menghasilkan satu kalimat", () => {
    const aturan = ringkasAturan(
      diskon({
        cakupan: "Item",
        tipe: "nominal",
        tanggalMulai: "2026-10-01T00:00:00.000Z",
        jamMulai: "10:00",
        jamSelesai: "14:00",
        hariAktif: [1, 2],
        minimalBelanja: 500,
        kuota: 10,
        sisaKuota: 3,
        kuotaPerPelanggan: 2,
        khususMember: true,
        produkIDs: ["p1", "p2"],
        hitungPerBarang: true,
      }),
    );
    expect(aturan).toHaveLength(9);
    expect(aturan[0].startsWith("Berlaku mulai ")).toBe(true);
    expect(aturan.slice(1)).toEqual([
      "Jam 10:00 sampai 14:00",
      "Hari Sen, Sel",
      "Minimal belanja Rp 500",
      "Kuota 3 dari 10 tersisa",
      "Maksimal 2 kali per pelanggan",
      "Khusus member",
      "2 produk tertentu",
      "Dihitung per barang",
    ]);
  });

  it("menandai diskon Aktif yang tidak sedang berlaku", () => {
    expect(aktifTetapiTidakBerlaku(diskon({ sedangBerlaku: false }))).toBe(true);
    expect(aktifTetapiTidakBerlaku(diskon({ status: "Non-Aktif", sedangBerlaku: false }))).toBe(false);
    expect(aktifTetapiTidakBerlaku(diskon())).toBe(false);
  });
});

describe("aksiDiskon", () => {
  it("mengikuti izin endpoint masing-masing", () => {
    expect(aksiDiskon(["update-diskon"])).toEqual({ buat: false, ubah: true });
  });
});