import { describe, expect, it } from "vitest";
import { keTanggalLokal } from "@/lib/waktu";
import { skemaDiskon } from "@/features/diskon/schema";
import {
  NILAI_AWAL_DISKON,
  nilaiAwalDiskon,
  payloadBuatDiskon,
  payloadPerbaruiDiskon,
} from "@/features/diskon/payload";
import { ATURAN_DISKON_KOSONG } from "@/features/diskon/tampilan";
import type { Diskon } from "@/types/diskon";

const diskon = (ubah: Partial<Diskon> = {}): Diskon => ({
  id: "64f000000000000000000001",
  namaDiskon: "Promo Aturan",
  cakupan: "Item",
  tipe: "nominal",
  nilai: 500,
  bisaDigabung: false,
  status: "Aktif",
  ...ATURAN_DISKON_KOSONG,
  tenantID: "64f000000000000000000002",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...ubah,
});

const isian = (ubah: Partial<typeof NILAI_AWAL_DISKON> = {}, dasar: Diskon = diskon()) => ({
  ...nilaiAwalDiskon(dasar),
  ...ubah,
});

describe("skemaDiskon: aturan tambahan", () => {
  it("menerima aturan kosong dan aturan yang lengkap", () => {
    expect(skemaDiskon.safeParse(isian()).success).toBe(true);
    expect(
      skemaDiskon.safeParse(
        isian({
          tanggalMulai: "2026-10-05",
          tanggalBerakhir: "2026-10-05",
          jamMulai: "22:00",
          jamSelesai: "02:00",
          hariAktif: [5, 6],
          minimalBelanja: "0",
          kuota: "10",
          kuotaPerPelanggan: "1",
        }),
      ).success,
    ).toBe(true);
  });

  it("menolak tanggal berakhir sebelum tanggal mulai", () => {
    expect(
      skemaDiskon.safeParse(isian({ tanggalMulai: "2026-10-05", tanggalBerakhir: "2026-10-04" })).success,
    ).toBe(false);
  });

  it("menolak jam yang hanya diisi satu, tidak lengkap, atau sama", () => {
    expect(skemaDiskon.safeParse(isian({ jamMulai: "10:00" })).success).toBe(false);
    expect(skemaDiskon.safeParse(isian({ jamMulai: "10:", jamSelesai: "14:00" })).success).toBe(false);
    expect(skemaDiskon.safeParse(isian({ jamMulai: "10:00", jamSelesai: "10:00" })).success).toBe(false);
  });

  it("menolak kuota nol, desimal, dan minimal belanja negatif", () => {
    expect(skemaDiskon.safeParse(isian({ kuota: "0" })).success).toBe(false);
    expect(skemaDiskon.safeParse(isian({ kuotaPerPelanggan: "1.5" })).success).toBe(false);
    expect(skemaDiskon.safeParse(isian({ minimalBelanja: "-1" })).success).toBe(false);
  });
});

describe("payloadBuatDiskon: aturan tambahan", () => {
  it("tanpa aturan hanya memuat enam field dasar", () => {
    expect(Object.keys(payloadBuatDiskon(isian())).sort()).toEqual([
      "bisaDigabung",
      "cakupan",
      "namaDiskon",
      "nilai",
      "status",
      "tipe",
    ]);
  });

  it("memuat aturan yang diisi, dengan angka sebagai angka dan hari terurut", () => {
    const payload = payloadBuatDiskon(
      isian({
        jamMulai: "10:00",
        jamSelesai: "14:00",
        hariAktif: [5, 1],
        minimalBelanja: "500",
        kuota: "10",
        kuotaPerPelanggan: "2",
        produkIDs: ["b", "a"],
        hitungPerBarang: true,
      }),
    );
    expect(payload).toMatchObject({
      jamMulai: "10:00",
      jamSelesai: "14:00",
      hariAktif: [1, 5],
      minimalBelanja: 500,
      kuota: 10,
      kuotaPerPelanggan: 2,
      produkIDs: ["a", "b"],
      hitungPerBarang: true,
    });
  });

  it("tanggal dikirim sebagai awal dan akhir hari lokal", () => {
    const payload = payloadBuatDiskon(
      isian({ tanggalMulai: "2026-10-05", tanggalBerakhir: "2026-10-05" }),
    );
    const mulai = new Date(payload.tanggalMulai as string);
    const berakhir = new Date(payload.tanggalBerakhir as string);
    expect(keTanggalLokal(mulai)).toBe("2026-10-05");
    expect(keTanggalLokal(berakhir)).toBe("2026-10-05");
    expect(mulai.getHours()).toBe(0);
    expect(berakhir.getHours()).toBe(23);
    expect(berakhir.getTime()).toBeGreaterThan(mulai.getTime());
  });

  it("produk tertentu dan hitung per barang diabaikan di luar cakupan dan tipenya", () => {
    const global = payloadBuatDiskon(
      isian({ cakupan: "Global", produkIDs: ["a"], hitungPerBarang: true }),
    );
    expect(global.produkIDs).toBeUndefined();
    expect(global.hitungPerBarang).toBeUndefined();
    const persen = payloadBuatDiskon(isian({ tipe: "persen", nilai: "10", hitungPerBarang: true }));
    expect(persen.hitungPerBarang).toBeUndefined();
  });
});

describe("payloadPerbaruiDiskon: aturan tambahan", () => {
  const beraturan = diskon({
    tanggalMulai: new Date(2026, 9, 5, 0, 0, 0, 0).toISOString(),
    jamMulai: "10:00",
    jamSelesai: "14:00",
    hariAktif: [1, 5],
    minimalBelanja: 500,
    kuota: 10,
    sisaKuota: 10,
    kuotaPerPelanggan: 2,
    produkIDs: ["a", "b"],
    hitungPerBarang: true,
  });

  it("kosong bila aturan tidak berubah, termasuk tanggal yang sama", () => {
    expect(payloadPerbaruiDiskon(isian({}, beraturan), beraturan)).toEqual({});
  });

  it("aturan yang dikosongkan dikirim sebagai null, nol, atau array kosong", () => {
    expect(
      payloadPerbaruiDiskon(
        isian(
          {
            tanggalMulai: "",
            jamMulai: "",
            jamSelesai: "",
            hariAktif: [],
            minimalBelanja: "",
            kuota: "",
            kuotaPerPelanggan: "",
            produkIDs: [],
            hitungPerBarang: false,
          },
          beraturan,
        ),
        beraturan,
      ),
    ).toEqual({
      tanggalMulai: null,
      jamMulai: null,
      jamSelesai: null,
      hariAktif: [],
      minimalBelanja: 0,
      kuota: null,
      kuotaPerPelanggan: null,
      produkIDs: [],
      hitungPerBarang: false,
    });
  });

  it("jam selalu dikirim berpasangan walau hanya satu yang berubah", () => {
    expect(payloadPerbaruiDiskon(isian({ jamSelesai: "15:00" }, beraturan), beraturan)).toEqual({
      jamMulai: "10:00",
      jamSelesai: "15:00",
    });
  });

  it("berpindah ke cakupan Global ikut mengosongkan produk dan hitung per barang", () => {
    expect(payloadPerbaruiDiskon(isian({ cakupan: "Global" }, beraturan), beraturan)).toEqual({
      cakupan: "Global",
      produkIDs: [],
      hitungPerBarang: false,
    });
  });
});